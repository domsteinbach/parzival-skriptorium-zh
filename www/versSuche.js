// Vers search for the JSON-driven fragment viewers (FrgZh, WhFrg77).
//
// Contract:
//   window.findVersSlide(blattInfo, eingabe) -> dpSlide (number) or null
//     blattInfo is the blattInfo array of the page's blattInfo.json; each
//     entry's dpKonkordanz lists the verses of its double page, e.g.
//       "Tristan 3177–3314, 3867–4004"            (plain verse numbers)
//       "Parzival 5.21–10.7, 10.8–14.26"          (Dreißiger.Vers)
//       "416.3–11, 417.4–13"                      (end shorthand: 416.3–416.11)
//       "424.6–13, 435.29b–436.5"                 (b-verses count as the verse)
//     eingabe is what the reader typed: "3200", "5.24", "416,5" or "416"
//     (a bare Dreißiger matches the first double page containing any of its
//     verses).

(function () {
  // "416.3" -> { s: 416, l: 3 }, "2209" -> { s: 2209, l: null }
  function parseVers(text) {
    var m = String(text).trim().replace(',', '.').match(/^(\d+)(?:\.(\d+))?[a-z]?$/i);
    if (!m) return null;
    return { s: parseInt(m[1], 10), l: m[2] !== undefined ? parseInt(m[2], 10) : null };
  }

  function compare(a, b) {
    return a.s !== b.s ? a.s - b.s : a.l - b.l;
  }

  // "Willehalm 416.3–11, 417.4–13" -> [{ start, end }, ...]
  function parseKonkordanz(konkordanz) {
    var ranges = [];
    var text = (konkordanz || '').replace(/^[^\d]*/, '');
    text.split(',').forEach(function (part) {
      var bounds = part.split(/[–-]/);
      var start = parseVers(bounds[0]);
      var end = bounds.length > 1 ? parseVers(bounds[1]) : start;
      if (!start || !end) return;
      // "416.3–11": the end is a verse within the start's Dreißiger
      if (start.l !== null && end.l === null) end = { s: start.s, l: end.s };
      ranges.push({ start: start, end: end });
    });
    return ranges;
  }

  function contains(range, vers) {
    var dotted = range.start.l !== null;
    if (vers.l === null) {
      // plain number: a verse number (Tristan) or a whole Dreißiger
      return vers.s >= range.start.s && vers.s <= range.end.s;
    }
    return dotted && compare(range.start, vers) <= 0 && compare(vers, range.end) <= 0;
  }

  window.findVersSlide = function (blattInfo, eingabe) {
    var vers = parseVers(eingabe);
    if (!vers) return null;
    for (var i = 0; i < blattInfo.length; i++) {
      var ranges = parseKonkordanz(blattInfo[i].dpKonkordanz);
      for (var j = 0; j < ranges.length; j++) {
        if (contains(ranges[j], vers)) return blattInfo[i].dpSlide;
      }
    }
    return null;
  };
})();
