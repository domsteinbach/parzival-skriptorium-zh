// IIIF + OpenSeadragon viewer wrapper for the Parzival-Skriptorium manuscripts.
//
// Ported from the sibling wellcome-schreiber repo, trimmed for parzival
// (no per-manuscript crop/scale tables) and extended so one wrapper serves
// all three viewers:
//
// Contract:
//   window.renderSpread(containerId, leftInput, rightInput)
//     leftInput / rightInput are whatever the legacy bildAnzeigeDS() assigns
//     to the verso/recto <img>. Each may be:
//       (a) a legacy local path, e.g. "./50/FrgZh_009v_30v_Tr_04.jpg" or
//           "50/T001v.jpg" — the wrapper strips the "<digits>/" prefix and
//           image extension to a stem, looks it up in a window.blattInfoIIIF_*
//           mapping, and resolves it to a IIIF info.json;
//       (b) an already-built IIIF image URL, e.g.
//           "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_00010/full/,640/0/default.jpg"
//           (BSB) — rewritten to the service's info.json and used directly;
//       (c) a blank sentinel (transparent.png / blind.gif / #) — that side
//           renders empty.
//     Mapping VALUES may themselves be a bare GUID (built into a UB Bern v3
//     info.json URL) or an absolute ".../info.json" URL (used as-is — how the
//     ONB mapping works).
//
//   Both folios are stitched into ONE OpenSeadragon instance (verso left,
//   recto right, small gap), sharing one zoom/pan canvas. Missing/blank sides
//   render empty; per-side errors are surfaced without breaking the other.
//   Idempotent: each call tears down the previous viewer.
//
// Depends on: OpenSeadragon (CDN <script> in the consuming page) and, for
// path-form inputs, a window.blattInfoIIIF_* mapping loaded before this file.

(function () {
  var IIIF_V3_BASE = 'https://iiif.ub.unibe.ch/image/v3.0/';
  // Between-folio gap, in OSD viewport units.
  var SPREAD_GAP = 0.02;
  var activeViewer = null;

  // Suppress the browser's default blue focus ring on the OSD canvas.
  (function injectOsdFocusStyle() {
    if (document.getElementById('osdViewer-focus-style')) return;
    var style = document.createElement('style');
    style.id = 'osdViewer-focus-style';
    style.textContent =
      '.openseadragon-container:focus,' +
      '.openseadragon-container *:focus,' +
      '.openseadragon-canvas:focus,' +
      '.openseadragon-canvas canvas:focus{outline:none;}';
    document.head.appendChild(style);
  })();

  // --- input classification --------------------------------------------

  // Legacy sentinels meaning "no image on this side".
  var BLANK_SENTINELS = /(?:^|\/)(?:transparent\.png|blind\.gif|#)$/i;

  function isBlankInput(v) {
    return !v || BLANK_SENTINELS.test(v);
  }

  // A ready IIIF URL: either an image request (…/full/…/default.jpg) or an
  // info.json. We turn both into the service's info.json.
  function isIiifUrl(v) {
    return /^https?:\/\//i.test(v) && /\/(full|square|\d+,|pct:|info\.json)/i.test(v);
  }

  // Strip a IIIF image request down to its info.json:
  //   .../{id}/full/,640/0/default.jpg  ->  .../{id}/info.json
  //   .../{id}/info.json                ->  unchanged
  function iiifUrlToInfoJson(v) {
    if (/\/info\.json$/i.test(v)) return v;
    // Remove the IIIF image API params: {region}/{size}/{rotation}/{quality}.{fmt}
    var m = v.match(/^(https?:\/\/.*?)\/(full|square|pct:[^/]+|\d+,\d*|\d*,\d+|[\d.]+,[\d.]+,[\d.]+,[\d.]+)\/[^/]+\/[^/]+\/[^/]+$/i);
    if (m) return m[1] + '/info.json';
    // Fallback: cut at the last 4 path segments (size/rotation/quality.fmt + region).
    return v.replace(/\/(full|square|pct:[^/]+|[\d.,]+)\/[^/]+\/[^/]+\/[^/]+$/i, '/info.json');
  }

  // Legacy local path -> lookup stem: strip "./" , leading "<digits>/", and ext.
  function pathToKey(v) {
    if (!v) return null;
    return v
      .replace(/^\.?\//, '')
      .replace(/^\d+\//, '')
      .replace(/\.(jpg|jpeg|png)$/i, '');
  }

  // Collect every window.blattInfoIIIF_* mapping (cached). The primary
  // (manuscript-native) mapping's <script> should load first.
  var _mappingCache = null;
  function collectMappings() {
    if (_mappingCache) return _mappingCache;
    var mappings = [];
    var keys = Object.keys(window);
    for (var i = 0; i < keys.length; i++) {
      var name = keys[i];
      // e.g. blattInfoIIIF_FrgZh, blattInfoIIIF_T  (skip the _T_onb alt)
      if (/^blattInfoIIIF_[A-Za-z]+$/.test(name) && !/_onb$/i.test(name) &&
          window[name] && typeof window[name] === 'object') {
        mappings.push({ name: name, map: window[name] });
      }
    }
    _mappingCache = mappings;
    return mappings;
  }

  function lookupMapping(key) {
    if (!key) return null;
    var mappings = collectMappings();
    if (mappings.length === 0) {
      console.warn('[osdViewer] no window.blattInfoIIIF_* mapping loaded');
      return null;
    }
    for (var i = 0; i < mappings.length; i++) {
      var hit = mappings[i].map[key];
      if (hit) return hit;
    }
    return null;
  }

  // A mapping value is either a bare GUID or an absolute info.json URL.
  function mappingValueToInfoJson(value) {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    return IIIF_V3_BASE + value + '/info.json';
  }

  // Resolve one side's input to a IIIF info.json URL (or null).
  //   returns { infoUrl, key }  — key is the stem if a lookup was attempted
  //   (used to distinguish "designed blank" from "mapping miss").
  function resolveInfo(v) {
    if (isBlankInput(v)) return { infoUrl: null, key: null };
    if (isIiifUrl(v)) return { infoUrl: iiifUrlToInfoJson(v), key: null };
    var key = pathToKey(v);
    var value = lookupMapping(key);
    return { infoUrl: value ? mappingValueToInfoJson(value) : null, key: key };
  }

  // --- error overlays ---------------------------------------------------
  function showSideError(containerEl, side, message) {
    var overlay = document.createElement('div');
    overlay.className = 'osdSpread-error osdSpread-error-' + side;
    overlay.textContent = message;
    overlay.style.position = 'absolute';
    overlay.style.top = '50%';
    overlay.style.transform = 'translateY(-50%)';
    overlay.style.padding = '8px 12px';
    overlay.style.background = 'rgba(255, 240, 240, 0.95)';
    overlay.style.color = '#8B1B31';
    overlay.style.font = '12px Arial, Helvetica, sans-serif';
    overlay.style.border = '1px solid #8B1B31';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10';
    overlay.style[side === 'left' ? 'left' : 'right'] = '10%';
    containerEl.appendChild(overlay);
  }

  function makeInlineBanner(message) {
    var el = document.createElement('div');
    el.className = 'osdSpread-error';
    el.textContent = message;
    el.style.position = 'absolute';
    el.style.top = '8px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.padding = '6px 10px';
    el.style.background = 'rgba(255, 240, 240, 0.95)';
    el.style.color = '#8B1B31';
    el.style.font = '12px Arial, Helvetica, sans-serif';
    el.style.border = '1px solid #8B1B31';
    el.style.zIndex = '10';
    el.style.pointerEvents = 'none';
    return el;
  }

  // --- the public entry point ------------------------------------------
  window.renderSpread = function (containerId, leftInput, rightInput) {
    var containerEl = document.getElementById(containerId);
    if (!containerEl) {
      console.warn('[osdViewer] container not found: ' + containerId);
      return;
    }
    if (typeof OpenSeadragon === 'undefined') {
      console.warn('[osdViewer] OpenSeadragon not loaded');
      containerEl.textContent = 'OpenSeadragon not loaded';
      return;
    }

    if (activeViewer) {
      try { activeViewer.destroy(); } catch (_) {}
      activeViewer = null;
    }
    containerEl.innerHTML = '';

    var left = resolveInfo(leftInput);
    var right = resolveInfo(rightInput);
    var leftBlank = isBlankInput(leftInput);
    var rightBlank = isBlankInput(rightInput);

    if (left.key && !left.infoUrl) console.warn('[osdViewer] no mapping for left stem: ' + left.key);
    if (right.key && !right.infoUrl) console.warn('[osdViewer] no mapping for right stem: ' + right.key);

    if (!left.infoUrl && !right.infoUrl) {
      containerEl.textContent = 'No image available for this spread.';
      return;
    }

    // Side-by-side layout. Each folio is normalized to width = 1 in viewport
    // units; the right folio is offset to x = 1 + SPREAD_GAP so the two sit
    // next to each other with a small gutter. Using width=1 (rather than
    // height=1) lets OSD's default home fit frame the whole spread correctly
    // for a wide container — a height=1 layout collapses the fit and hides
    // the second folio. OSD reads each image's true aspect ratio from its
    // own info.json, so pages of differing proportions still align at the top.
    var tileSources = [];
    if (left.infoUrl) {
      tileSources.push({ tileSource: left.infoUrl, x: 0, y: 0, width: 1 });
    }
    if (right.infoUrl) {
      var rightX = left.infoUrl ? 1 + SPREAD_GAP : 0;
      tileSources.push({ tileSource: right.infoUrl, x: rightX, y: 0, width: 1 });
    }

    (function () {
      activeViewer = OpenSeadragon({
        element: containerEl,
        prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@4/build/openseadragon/images/',
        tileSources: tileSources,
        showNavigator: false,
        showRotationControl: false,
        collectionMode: false,
        crossOriginPolicy: 'Anonymous',
        ajaxWithCredentials: false,
        animationTime: 0.4,
        springStiffness: 15,
        zoomPerScroll: 1.6,
        gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
        gestureSettingsTouch: { clickToZoom: false, dblClickToZoom: true },
        gestureSettingsPen: { clickToZoom: false, dblClickToZoom: true },
      });
      // On the first render (e.g. right after DOMContentLoaded) OSD can open
      // before the container has its final size, leaving a blank canvas until
      // the next render. Re-home once open, after a frame, so the spread is
      // framed against the settled container dimensions.
      activeViewer.addHandler('open', function () {
        requestAnimationFrame(function () {
          if (activeViewer && activeViewer.viewport) activeViewer.viewport.goHome(true);
        });
      });

      activeViewer.addHandler('open-failed', function (evt) {
        console.warn('[osdViewer] open-failed', evt);
        containerEl.appendChild(makeInlineBanner('IIIF image failed to load. Check network / CORS / info.json.'));
      });
      activeViewer.addHandler('tile-load-failed', function (evt) {
        if (!containerEl.querySelector('.osdSpread-error-tile')) {
          var el = makeInlineBanner('Some tiles failed to load — image may be incomplete.');
          el.classList.add('osdSpread-error-tile');
          containerEl.appendChild(el);
        }
        console.warn('[osdViewer] tile-load-failed', evt);
      });
    })();

    // Flag a genuine mapping miss (not a designed blank) per side.
    if (!left.infoUrl && !leftBlank) {
      showSideError(containerEl, 'left', left.key ? ('No IIIF mapping for ' + left.key) : 'No image');
    }
    if (!right.infoUrl && !rightBlank) {
      showSideError(containerEl, 'right', right.key ? ('No IIIF mapping for ' + right.key) : 'No image');
    }
  };

  // --- arrow-key page turning ------------------------------------------
  function isEditableTarget(t) {
    if (!t) return false;
    var tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return t.isContentEditable === true;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isEditableTarget(e.target)) return;
    var handler = e.key === 'ArrowRight' ? window.goNextPage : window.goPrevPage;
    if (typeof handler !== 'function') return;
    e.preventDefault();
    e.stopPropagation();
    handler();
  }, true);

  // Hide the "Buch wählen" section select when the manuscript defines no
  // sections (only the placeholder option). FrgZh and BSB have no Abschnitte;
  // ONB does, so its select stays. Hides just the #dropdown so the concordance
  // (#versAnzeige) below it in the same group still shows.
  function hideEmptyBookSelect() {
    var menu = document.getElementById('buchMenu');
    if (!menu) return;
    var real = 0;
    for (var i = 0; i < menu.options.length; i++) {
      if ((menu.options[i].value || '').trim() !== 'javascript:') real++;
    }
    if (real === 0) {
      var dd = document.getElementById('dropdown');
      if (dd) dd.style.display = 'none';
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideEmptyBookSelect);
  } else {
    hideEmptyBookSelect();
  }
})();
