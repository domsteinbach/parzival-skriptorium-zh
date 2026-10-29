var blattInfoData;
var currentSlide = 0;
var dpSlide = 0; // doppelSeiten slide

// Load JSON data using fetch
fetch('./blattInfo.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json(); // Return the JSON data
    })
    .then(data => {
        blattInfoData = data; // Assign the fetched data to the variable
        zoom = 50;
        // The JSON fetch can resolve before the <body> (and the imgFaksimile*
        // elements bildAnzeigeDSNeu writes to) exist. Defer the first render
        // until the DOM is ready.
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bildAnzeigeDSNeu);
        } else {
            bildAnzeigeDSNeu();
        }
    })
    .catch(error => console.error('There was a problem with the fetch operation:', error));


function TasteGedrueckt(Ereignis) {
    if (parseInt(zoom) != 150) {
        if (window.event.keyCode == 37) {
            goPrevPage();
            return true;
        }
        if (window.event.keyCode == 39) {
            goNextPage();
            return true;
        }
    }
}

document.onkeydown = TasteGedrueckt;
// Aus html übernommen
//--------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("dropdown").addEventListener("mouseover", function () {
        Tip('Buch wählen');
    });

    document.getElementById("dropdown").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("buchMenu").addEventListener("change", function () {
        MM_jumpMenuParts();
    });
    document.getElementById("blatt").addEventListener("mouseover", function () {
        Tip('Blatt finden');
    });

    document.getElementById("blatt").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("blattInput").addEventListener("keypress", function (event) {
        return submitenter(this, event);
    });

    document.getElementById("submitBlattImg").addEventListener("mouseover", function () {
        Tip('Blatt finden');
    });

    document.getElementById("submitBlattImg").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("submitBlattImg").addEventListener("click", function () {
        checkSeitenEingabe();
    });
    document.getElementById("vers").addEventListener("mouseover", function () {
        Tip('Vers finden');
    });

    document.getElementById("vers").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("versInput").addEventListener("keypress", function (event) {
        return submitenter(this, event);
    });

    document.getElementById("submitVersImg").addEventListener("mouseover", function () {
        Tip('Vers finden');
    });

    document.getElementById("submitVersImg").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("submitVersImg").addEventListener("click", function () {
        checkVersEingabe();
    });
    document.getElementById("handschrift").addEventListener("mouseover", function () {
        Tip('Handschrift wählen');
    });

    document.getElementById("handschrift").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("handMenu").addEventListener("change", function () {
        MM_jumpHandschrift();
    });
    document.getElementById("blaettern1").addEventListener("mouseover", function () {
        Tip('vorheriger Abschnitt');
    });

    document.getElementById("blaettern1").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("blaettern1").addEventListener("click", function () {
        goPrevBook();
    });

    document.getElementById("blaettern2").addEventListener("mouseover", function () {
        Tip('zurückblättern');
    });

    document.getElementById("blaettern2").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("blaettern2").addEventListener("click", function () {
        goPrevPage();
    });

    document.getElementById("blaettern3").addEventListener("mouseover", function () {
        Tip('weiterblättern');
    });

    document.getElementById("blaettern3").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("blaettern3").addEventListener("click", function () {
        goNextPage();
    });

    document.getElementById("blaettern4").addEventListener("mouseover", function () {
        Tip('nächster Abschnitt');
    });

    document.getElementById("blaettern4").addEventListener("mouseout", function () {
        UnTip();
    });

    document.getElementById("blaettern4").addEventListener("click", function () {
        goNextBook();
    });
    // Zoom-button bindings (g50/g100/g150/zoom±) removed: OpenSeadragon
    // provides continuous zoom, and those buttons are no longer in the DOM.
});

// Funktion, um Tooltip anzuzeigen
function Tip(text) {
    var tooltip = document.createElement("div");
    tooltip.innerHTML = text;
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);

    document.addEventListener("mousemove", updateTooltipPosition);

    function updateTooltipPosition(event) {
        var x = event.clientX + 10;
        var y = event.clientY - 30;

        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }
}

// Funktion, um Tooltip zu entfernen
function UnTip() {
    var tooltip = document.querySelector(".tooltip");
    if (tooltip) {
        tooltip.parentNode.removeChild(tooltip);
    }
}

// Manual +/- zoom is obsolete under OpenSeadragon (continuous zoom). Kept as
// no-ops so any lingering caller doesn't throw.
function zoomin() {}
function zoomout() {}


function isOnLastSinglePage() {
    const lastPageIdx = blattInfoData.blattInfo.length - 1; // the very last blatt index in the json
    return currentSlide === lastPageIdx;
}

function isOnLastDoublePage() {
    const lastPageIdx = blattInfoData.blattInfo.length - 1; // the very last blatt index in the json
    const lastDoublePageNumber = blattInfoData.blattInfo[lastPageIdx]?.dpSlide; // the last double page number in the data
    return dpSlide === lastDoublePageNumber;
}

// reset the current slide, i.e. the index of a single page when the double page changes
function resetCurrentSlide() {
    const nextDP = blattInfoData.blattInfo.filter(b => b.dpSlide === dpSlide); // get the double page (an array of all pages with that dpSlide)
    currentSlide = blattInfoData.blattInfo.findIndex(b => b.blatt === nextDP[0].blatt); // get the index of the first page in the double page
}

function resetDPSlide() {
    const nextBlatt = blattInfoData.blattInfo[currentSlide]; // get the blatt from the data
    dpSlide = nextBlatt.dpSlide;
}

function goNextPage() {
    if (zoom === 50) { // we are in double pages view
        if (isOnLastDoublePage()) {
            return; // we don't do anything, because we are aleady on the last double page
        }
        dpSlide += 1; // increase the double page number
        bildAnzeigeDSNeu();
        resetCurrentSlide(); // reset also the single page
    } else { // we are in single page view
        if (isOnLastSinglePage()) {
            return; // we don't do anything because we are already on the last page
        } // else we go to the next page/blatt
        currentSlide += 1; // increase
        bildAnzeigeESNeu(); // display single page
        resetDPSlide(); // but also reset the double page number according to the new current single page 
    }
}

function goPrevPage() {
    if (zoom === 50) {
        if (dpSlide === 0) {
            return; // we abort becasue we are already on the first page
        }
        dpSlide = dpSlide - 1; // decrease
        bildAnzeigeDSNeu(); // display
        resetCurrentSlide(); // also set the single page to the first page of the new double page.
    } else { // we are in single page view
        if (currentSlide == 0) {
            return; // we are already at the very first single page
        }
        currentSlide -= 1; // decrease    
        bildAnzeigeESNeu(); // display
        resetDPSlide(); // but also reset the double page number according to the new current single page 
    }
}

// The single-page view is retired (OSD shows the codicological spread only,
// zoom === 50 always). Any residual caller is redirected to the spread so it
// never touches the removed imgFaksimile* elements.
function bildAnzeigeESNeu() {
    resetDPSlide();
    bildAnzeigeDSNeu();
}

// The fragment has no Lage number: "Lage, Quaternio (?)" instead of "1. Lage, ..."
function lagenPrefix(page) {
    return (page.lagenNr ? page.lagenNr + '. ' : '') + 'Lage, ' + page.dpLagenName;
}

function bildAnzeigeDSNeu() {

    const doublePage = blattInfoData.blattInfo.filter(b => b.dpSlide === dpSlide);
    const blankPage = "transparent.png";

    const versoPage = doublePage.find(p => p.blatt.endsWith('v'));
    const rectoPage = doublePage.find(p => p.blatt.endsWith('r'));

    let seitenAngabe;
    let konkordanz;
    let schreiber;
    let lagenSym;
    let lagenText;
    let buch;
    let bildURLv;   // verso (left) image stem — resolved via blattInfoIIIF_WhFrg77 by renderSpread
    let bildURLr;   // recto (right) image stem

    if (versoPage && rectoPage) {
        // echte Doppelseite: Verso links, Recto rechts
        seitenAngabe = 'Bl. ' + versoPage.blatt + ' / ' + rectoPage.blatt;
        konkordanz   = versoPage.dpKonkordanz;
        schreiber    = versoPage.schreiber;
        lagenSym     = "../Lagensymbole/Doppelseite/" + versoPage.dpLagenSymb + ".gif";
        lagenText    = lagenPrefix(versoPage);
        buch         = versoPage.aktBuch;

        bildURLv = versoPage.img;
        // 3v/6r is one scan of both facing pages: show it once across the spread
        bildURLr = rectoPage.img === versoPage.img ? blankPage : rectoPage.img;

    } else if (rectoPage) {
        // nur Recto vorhanden → links transparent, rechts das Blatt
        seitenAngabe = 'Bl. ' + rectoPage.blatt;
        konkordanz   = rectoPage.dpKonkordanz;
        schreiber    = rectoPage.schreiber;
        lagenSym     = "../Lagensymbole/Doppelseite/" + rectoPage.dpLagenSymb + ".gif";
        lagenText    = lagenPrefix(rectoPage);
        buch         = rectoPage.aktBuch;

        bildURLv = blankPage;
        bildURLr = rectoPage.img;

    } else if (versoPage) {
        // nur Verso vorhanden → links das Blatt, rechts transparent
        seitenAngabe = 'Bl. ' + versoPage.blatt;
        konkordanz   = versoPage.dpKonkordanz;
        schreiber    = versoPage.schreiber;
        lagenSym     = "../Lagensymbole/Doppelseite/" + versoPage.dpLagenSymb + ".gif";
        lagenText    = lagenPrefix(versoPage);
        buch         = versoPage.aktBuch;

        bildURLv = versoPage.img;
        bildURLr = blankPage;
    }

    document.getElementById('blattAnzeige').innerHTML  = seitenAngabe;
    document.getElementById('versAnzeige').innerHTML   = konkordanz;
    document.getElementById('schreibAnzeige').innerHTML = schreiber;
    document.getElementById('lagenAnzeige').innerHTML  = lagenText;
    window.document.ImgLagensymbol.src                 = lagenSym;
    document.naviHSR.selectBook.selectedIndex          = buch;

    // IIIF/OpenSeadragon: hand the verso/recto image paths to the shared OSD
    // wrapper, which resolves them to UB Bern info.json tile sources and
    // stitches the spread (verso left, recto right).
    renderSpread('osdSpread', bildURLv, bildURLr);
}

// Zoom is now continuous in OpenSeadragon; the old 50/100/150 modes all map
// to the single stitched spread. (Buttons are hidden via CSS; these remain
// only because the DOMContentLoaded handler still binds click listeners.)
function zoom150() { zoom = 50; bildAnzeigeDSNeu(); }
function zoom100() { zoom = 50; bildAnzeigeDSNeu(); }
function zoom50()  { zoom = 50; bildAnzeigeDSNeu(); }

function disableManualZoom() {
    window.document.getElementById('zoomminus').style.visibility = 'hidden';
    window.document.getElementById('zoomplus').style.visibility = 'hidden';
    window.document.getElementById('zoomminusHell').style.visibility = 'visible';
    window.document.getElementById('zoomplusHell').style.visibility = 'visible';
}

function enableManualZoom() {
    console.log('ena');
    window.document.getElementById('zoomminus').style.visibility = 'visible';
    window.document.getElementById('zoomplus').style.visibility = 'visible';
    window.document.getElementById('zoomminusHell').style.visibility = 'hidden';
    window.document.getElementById('zoomplusHell').style.visibility = 'hidden';
}

// change to another Handschrift via the select
function MM_jumpHandschrift() {

    if (document.naviHSR.selectHand.value != "javascript:") {

        var temp = document.naviHSR.selectHand.value;
        document.naviHSR.selectHand.selectedIndex = 0;
        window.location.href = temp
    }
}

// listen to enter strokes
function submitenter(myfield, e) {
    var keycode;
    if (window.event) keycode = window.event.keyCode;
    else if (e) keycode = e.which;
    else return true;

    if (keycode == 13) {
        if (myfield.name == "Blatt") {
            checkSeitenEingabe();
            if (e.preventDefault) e.preventDefault();
            return false;
        } else if (myfield.name == "Vers") {
            checkVersEingabe();
            if (e.preventDefault) e.preventDefault();
            return false;
        }
    }
    return true;
}

// get the value of the blatt input and navigate to that blatt/ double page
function checkSeitenEingabe() {
    const seitenEingabe = document.naviHSR.Blatt.value;
    blattIdx = blattInfoData.blattInfo.findIndex(b => b.blatt.includes(seitenEingabe));
    if (blattIdx > -1) { // if something is found
        // set the slides
        currentSlide = blattIdx;
        resetDPSlide();
        if (zoom === 50) {
            bildAnzeigeDSNeu();
        } else {
            bildAnzeigeESNeu();
        }
    }
}

// get the value of the vers input and navigate to the double page containing it
// (verse parsing in ../versSuche.js)
function checkVersEingabe() {
    const versEingabe = document.naviHSR.Vers.value.trim();
    if (!versEingabe) {
        return;
    }
    const slide = findVersSlide(blattInfoData.blattInfo, versEingabe);
    if (slide === null) {
        alert("Vers " + versEingabe + " ist in diesem Fragment nicht überliefert.");
        return;
    }
    dpSlide = slide;
    bildAnzeigeDSNeu();
    resetCurrentSlide();
    document.naviHSR.Vers.value = "";
}

//Menu Abschnitte wählen
function MM_jumpMenuParts() {
    return;
}

function goNextBook() {
    return;
}

function goPrevBook() {
    return;
}
