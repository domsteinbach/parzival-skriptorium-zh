// IIIF + OpenSeadragon viewer wrapper for the Parzival-Skriptorium manuscripts.
//
// Ported from the sibling wellcome-schreiber repo (crop table and
// height-normalized spread layout included; no per-manuscript scale table)
// and extended so one wrapper serves all viewers:
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
//     info.json URL), an absolute ".../info.json" URL (used as-is — how the
//     ONB mapping works), or a relative path to a local .jpg/.png (shown as a
//     single static image — how the WhFrg77 PDF scans work).
//
//   Both folios are stitched into ONE OpenSeadragon instance (verso left,
//   recto right, small gap), sharing one zoom/pan canvas, each cropped by
//   GUID_CROP_PCT and scaled so their visible areas share top and bottom
//   edges. Missing/blank sides
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
  // Incremented per renderSpread call; an older call whose info.json fetch
  // resolves late is dropped instead of replacing the newer spread.
  var renderSeq = 0;

  // Per-image crop overrides for scans with photographic artifacts
  // (black shooting-stand borders, colour cards, mounts) that shouldn't be
  // visible in the reading view. Keyed by IIIF image identifier (the UB
  // Bern GUID, i.e. the path segment before /info.json).
  //
  // Value is a IIIF pct: region — { x, y, w, h } as percentages of the
  // master image. Example: { x: 5, y: 3, w: 92, h: 94 } crops 5% off the
  // left, 3% off the top, keeps a 92% × 94% window in the middle.
  //
  // The crop is applied *client-side* via OSD's tile-source `clip` rect,
  // so the full deep-zoom pyramid stays in use — tiles outside the clip
  // are simply never requested. Removing an entry instantly restores the
  // uncropped view.
  var GUID_CROP_PCT = {
    // 'image-guid': { x: 0, y: 0, w: 100, h: 100 },
  };

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
      // e.g. blattInfoIIIF_FrgZh, blattInfoIIIF_T, blattInfoIIIF_WhFrg77  (skip the _T_onb alt)
      if (/^blattInfoIIIF_[A-Za-z0-9]+$/.test(name) && !/_onb$/i.test(name) &&
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

  // A mapping value is a bare GUID, an absolute info.json URL, or a local
  // image path (returned as an OSD simple-image tile source object).
  function mappingValueToInfoJson(value) {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (/\.(jpg|jpeg|png)$/i.test(value)) return { type: 'image', url: value };
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

  var NO_CROP = { x: 0, y: 0, w: 100, h: 100 };

  function cropFor(source) {
    if (typeof source !== 'string') return null;
    var m = source.match(/\/([^\/]+)\/info\.json$/i);
    return m ? GUID_CROP_PCT[m[1]] || null : null;
  }

  // Raw pixel size { width, height } of an info.json or a simple-image
  // source, or null on failure. Cached: renderSpread runs on every page
  // turn, but a master's dimensions never change.
  var _dimsCache = {};
  function fetchDims(source) {
    if (!source) return Promise.resolve(null);
    var url = typeof source === 'string' ? source : source.url;
    if (_dimsCache[url] !== undefined) return Promise.resolve(_dimsCache[url]);
    var p = typeof source === 'string'
      ? fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      : new Promise(function (resolve) {
          var img = new Image();
          img.onload = function () { resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
          img.onerror = function () { resolve(null); };
          img.src = url;
        });
    return p.then(function (d) {
      var dims = d && d.width && d.height ? { width: d.width, height: d.height } : null;
      _dimsCache[url] = dims;
      return dims;
    }).catch(function () {
      _dimsCache[url] = null;
      return null;
    });
  }

  // OSD tile-source config placing one folio so that its VISIBLE (cropped)
  // area spans y = 0..1 and starts at x = visibleX. OSD's `clip` only culls
  // tiles outside the rect — it does not rescale or reposition the item,
  // whose bounds still come from the full master — so the item is scaled
  // to height 100/crop.h and shifted up/left by the cropped-off margins.
  // Returns { config, visibleWidth } (visibleWidth in viewport units, what
  // the next folio butts against). Without dims (fetch failed) the crop is
  // skipped and the aspect ratio falls back to 1.
  function placeFolio(source, dims, visibleX) {
    var crop = (dims && cropFor(source)) || NO_CROP;
    var ar = dims ? dims.width / dims.height : 1;
    var itemH = 100 / crop.h;
    var itemW = ar * itemH;
    var config = {
      tileSource: source,
      x: visibleX - itemW * crop.x / 100,
      y: -itemH * crop.y / 100,
      height: itemH,
    };
    if (crop !== NO_CROP) {
      config.clip = new OpenSeadragon.Rect(
        dims.width * (crop.x / 100),
        dims.height * (crop.y / 100),
        dims.width * (crop.w / 100),
        dims.height * (crop.h / 100)
      );
    }
    return { config: config, visibleWidth: itemW * crop.w / 100 };
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

    // Layout is height-normalized (as in wellcome-schreiber): both folios'
    // visible areas sit on the same top and bottom edge (viewport height = 1)
    // and their widths follow each image's (cropped) aspect ratio — folios of
    // the same height, possibly differing widths, like a physical bifolium.
    // Needs each side's dimensions before OSD init, hence the fetch.
    var seq = ++renderSeq;
    Promise.all([fetchDims(left.infoUrl), fetchDims(right.infoUrl)]).then(function (dims) {
      if (seq !== renderSeq) return;
      var leftFolio = left.infoUrl ? placeFolio(left.infoUrl, dims[0], 0) : null;
      var rightX = leftFolio ? leftFolio.visibleWidth + SPREAD_GAP : 0;
      var rightFolio = right.infoUrl ? placeFolio(right.infoUrl, dims[1], rightX) : null;
      var tileSources = [];
      if (leftFolio) tileSources.push(leftFolio.config);
      if (rightFolio) tileSources.push(rightFolio.config);
      var spreadWidth = rightFolio ? rightX + rightFolio.visibleWidth : leftFolio.visibleWidth;
      startViewer(tileSources, new OpenSeadragon.Rect(0, 0, spreadWidth, 1));
    });

    function startViewer(tileSources, visibleBounds) {
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
      // Home = the visible spread, not the items' full (uncropped) bounds,
      // so cropped-off margins don't count when framing. On the first render
      // (e.g. right after DOMContentLoaded) OSD can open before the container
      // has its final size, leaving a blank canvas until the next render.
      // Re-home once open, after a frame, so the spread is framed against
      // the settled container dimensions.
      // (Overrides this viewer's getHomeBounds — which goHome and the home
      // button use — since Viewport.setHomeBounds is deprecated in OSD 4.)
      var viewer = activeViewer;
      viewer.viewport.getHomeBounds = function () { return visibleBounds.clone(); };
      viewer.addHandler('open', function () {
        requestAnimationFrame(function () {
          if (viewer.viewport) viewer.viewport.goHome(true);
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
    }

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
  // sections (only the placeholder option). FrgZh, BSB and WhFrg77 have no
  // Abschnitte; ONB does, so its select stays. Uses visibility (not display)
  // so #dropdown keeps its slot and the header layout matches ONB: the
  // concordance (#versAnzeige) stays on the second row.
  function hideEmptyBookSelect() {
    var menu = document.getElementById('buchMenu');
    if (!menu) return;
    var real = 0;
    for (var i = 0; i < menu.options.length; i++) {
      if ((menu.options[i].value || '').trim() !== 'javascript:') real++;
    }
    if (real === 0) {
      var dd = document.getElementById('dropdown');
      if (dd) dd.style.visibility = 'hidden';
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideEmptyBookSelect);
  } else {
    hideEmptyBookSelect();
  }
})();
