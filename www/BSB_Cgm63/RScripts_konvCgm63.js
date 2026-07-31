// JavaScript Document

window.onload = function() {
    bildAnsichtKonv();
};


// Variablendeklaration;

//Variablen aus html übernommen
//--------------------------------------------------------------
var transkription = false;
var curSlide = '0';
//var iiifSlide = '00004';
var ansicht = window.localStorage.getItem('localStoreAnsicht');
var zoom = 50;
var rectoVerso = 'v';
var addChar = '';
//--------------------------------------------------------------

var anzeigeModus = "";
//var curSlide = parent.curSlideX;
//var zoom = parent.zoomX;
//var rectoVerso = parent.rectoVersoX;
//var zusatz = "";
//var bildURL = "";
//var buch = 1;
//var addChar = "";



// Definieren des ersten existierenden Bildes 
var firstPageDS = -2;
var firstPageES = -2;
var firstPageRV = "r";


// Definieren des letzten existierenden Bildes 
var lastPageDS = 115;
var lastPageES = 116;
var lastPageRV = "r";

// Definieren des ersten paginierten Blatts
var firstPaginiert = 1;

// Definieren des letzten paginierten Blatts
var lastPaginiert = 111;

// Definieren des letzten Buchs
var lastbook = 0;


var lageTxt = ". Lage, ";
var lagenAngabe = "";
var blattTxt = "Bl. ";
var seitenAngabe = "";
var blattAngabe = "";
var buchAuswahl = 2;
var browser;
var os;
var xmlURL = "bildverz.xml";
//var xmlURL;
aktBuch = parent.aktBuch;
var oesz=unescape("%F6%DF");
var ae = unescape("%e4");
var xmlDoc;
var bildbeschreibungen;
//systemWeiche();
//importXML();
localXML();

var illustrationenArr = new Array();

var addPage = new Map([]);
var ZPage = [];
			
var fenVer = ""
var fenKom = ""

// Aus html übernommen
//--------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("dropdown").addEventListener("mouseover", function() {
        Tip('Buch wählen');
    });

    document.getElementById("dropdown").addEventListener("mouseout", function() {
        UnTip();
    });

    document.getElementById("buchMenu").addEventListener("change", function() {
        MM_jumpMenuParts();
    });
	document.getElementById("blatt").addEventListener("mouseover", function() {
        Tip('Blatt finden');
    });

    document.getElementById("blatt").addEventListener("mouseout", function() {
        UnTip();
    });

    document.getElementById("blattInput").addEventListener("keypress", function(event) {
        return submitenter(this, event);
    });

    document.getElementById("submitBlattImg").addEventListener("mouseover", function() {
        Tip('Blatt finden');
    });

    document.getElementById("submitBlattImg").addEventListener("mouseout", function() {
        UnTip();
    });

    document.getElementById("submitBlattImg").addEventListener("click", function() {
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


	document.getElementById("handschrift").addEventListener("mouseover", function() {
        Tip('Handschrift wählen');
    });

    document.getElementById("handschrift").addEventListener("mouseout", function() {
        UnTip();
    });

    document.getElementById("handMenu").addEventListener("change", function() {
        MM_jumpHandschrift();
    });
	document.getElementById("blaettern1").addEventListener("mouseover", function() {
        Tip('vorheriger Abschnitt');
    });

    document.getElementById("blaettern1").addEventListener("mouseout", function() {
        UnTip();
    });

    document.getElementById("blaettern1").addEventListener("click", function() {
        goPrevBook();
    });

    document.getElementById("blaettern2").addEventListener("mouseover", function() {
        Tip('zurückblättern');
    });

    document.getElementById("blaettern2").addEventListener("mouseout", function() {
        UnTip();
    });

    document.getElementById("blaettern2").addEventListener("click", function() {
        goPrevPage();
    });

    document.getElementById("blaettern3").addEventListener("mouseover", function() {
        Tip('weiterblättern');
    });

    document.getElementById("blaettern3").addEventListener("mouseout", function() {
        UnTip();
    });

    document.getElementById("blaettern3").addEventListener("click", function() {
        goNextPage();
    });

    document.getElementById("blaettern4").addEventListener("mouseover", function() {
        Tip('nächster Abschnitt');
    });

    document.getElementById("blaettern4").addEventListener("mouseout", function() {
        UnTip();
    });

    document.getElementById("blaettern4").addEventListener("click", function() {
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

function TasteGedrueckt(Ereignis) {
	var zoom = parent.navigation.zoom;
	if (navigator.appName == "Netscape") {
		if (parseInt(zoom) != 150) {
			if (Ereignis.which == 37) {
				parent.navigation.goPrevPage();
			}
			if (Ereignis.which == 39) {
				parent.navigation.goNextPage();
			}
			return true;
		}
	}
	if (navigator.appName == "Microsoft Internet Explorer") {
		//zoom *= 1;
		//alert (typeof zoom);
		if (parseInt(zoom) != 150) {
			if (window.event.keyCode == 37) {
				parent.navigation.goPrevPage();
				return true;
			}
			if (window.event.keyCode == 39) {
				parent.navigation.goNextPage();
				return true;
			}
		}
	}
}

document.onkeydown = TasteGedrueckt;


function zoomin() {
	var GFG = document.getElementById("imgFaksimile");
	var currWidth = GFG.clientWidth;
	GFG.style.width = (currWidth + 100) + "px";
}

function zoomout() {
	var GFG = document.getElementById("imgFaksimile");
	var currWidth = GFG.clientWidth;
	GFG.style.width = (currWidth - 100) + "px";
}

//--------------------------------------------------------------

//Menu Abschnitte wählen
function MM_jumpMenuParts(){ 
	if (document.naviHSR.selectBook.value != "javascript:") {
			var temp = document.naviHSR.selectBook.value;
			rectoVerso = temp.substring(0,1);
			addChar = '';
			curSlide = parseInt(temp.substring(1));
			if (isNaN(curSlide)) {
				addChar = temp.substring(1,2);
				curSlide = parseInt(temp.substring(2));
			}
			document.naviHSR.selectBook.selectedIndex = 0;

			if (zoom==50) {
				if (rectoVerso == "r") {
					if (addPage.has(parseInt(curSlide))) {					
						if (addChar == "a") {
							curSlide--;
							addChar = "";
						} else {
							addChar = String.fromCodePoint(addChar.charCodeAt(0)-1);
							if (addChar == "j") {
								addChar = "i";
							}
						}
					} else if (addChar == "Z") {
						addChar = "";
					} else {
						curSlide--;
						if ((ZPage.indexOf(parseInt(curSlide)) != -1)) {
							addChar = "Z";
						}	
					}
					if ((addChar == "") && (addPage.has(parseInt(curSlide)))) {
						addChar = addPage.get(parseInt(curSlide));
					}
					rectoVerso = "v";
					}
				bildAnzeigeDS();
			} else {
				bildAnzeigeES();
		}
		
		window.localStorage.setItem('localStoreCurSlide', curSlide);
		window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
		window.localStorage.setItem('localStoreAddChar', addChar);
	}
}

function MM_jumpMenuPartsZ(){ 
	if (document.naviHSR.selectBook.value != "javascript:") {
		if (document.naviHSR.selectBook.selectedIndex == 1) {
			var temp = document.naviHSR.selectBook.value;
			rectoVerso = temp.substring(0,1);
			addChar = '';
			curSlide = 1;
			document.naviHSR.selectBook.selectedIndex = 1;
		} else {
			var buch = document.naviHSR.selectBook.value;
			rectoVerso = buch.substring(0,1);
			addChar = '';
			curSlide = parseInt(buch.substring(1));
			document.naviHSR.selectBook.selectedIndex = 0;
		}
		//if (rectoVerso=="v") {curSlide++;}
		bildAnzeigeZoom();
	}
}

function MM_jumpVerweise(){ 
	if (document.naviHSR.selectVerweise.value != "javascript:") {

			var temp = document.naviHSR.selectVerweise.value;
			rectoVerso = temp.substring(0,1);
			addChar = '';
			curSlide = parseInt(temp.substring(1));
			if (isNaN(curSlide)) {
				addChar = temp.substring(1,2);
				curSlide = parseInt(temp.substring(2));
			}
			document.naviHSR.selectVerweise.selectedIndex = 0;

			if (zoom==50) {
				if (rectoVerso == "r") {
					if (addPage.has(parseInt(curSlide))) {					
						if (addChar == "a") {
							curSlide--;
							addChar = "";
						} else {
							addChar = String.fromCodePoint(addChar.charCodeAt(0)-1);
							if (addChar == "j") {
								addChar = "i";
							}
						}
					} else if (addChar == "Z") {
						addChar = "";
					} else {
						curSlide--;
						if ((ZPage.indexOf(parseInt(curSlide)) != -1)) {
							addChar = "Z";
						}	
					}
					if ((addChar == "") && (addPage.has(parseInt(curSlide)))) {
						addChar = addPage.get(parseInt(curSlide));
					}
					rectoVerso = "v";
					}
				bildAnzeigeDS();
			} else {
				bildAnzeigeES();
			}
		
			window.localStorage.setItem('localStoreCurSlide', curSlide);
			window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
			window.localStorage.setItem('localStoreAddChar', addChar);
	}
}

function MM_jumpHandschrift(){
	
	if (document.naviHSR.selectHand.value != "javascript:") {

			var temp = document.naviHSR.selectHand.value;
			document.naviHSR.selectHand.selectedIndex = 0;
			window.location.href=temp
	}
}
			
function goNextBook () {
	if (aktBuch < lastbook) {
		document.naviHSR.selectBook.selectedIndex = (++aktBuch + 1);
	} else {return;}

	var temp = document.naviHSR.selectBook.value;
			rectoVerso = temp.substring(0,1);
			addChar = '';
			curSlide = parseInt(temp.substring(1));
			if (isNaN(curSlide)) {
				addChar = temp.substring(1,2);
				curSlide = parseInt(temp.substring(2));
			}

	if (zoom==50) {
		if (rectoVerso == "r") {
			if (addPage.has(parseInt(curSlide))) {					
				if (addChar == "a") {
					curSlide--;
					addChar = "";
				} else {
					addChar = String.fromCodePoint(addChar.charCodeAt(0)-1);
					if (addChar == "j") {
						addChar = "i";
					}
				}
			} else if (addChar == "Z") {
				addChar = "";
			} else {
				curSlide--;
				if ((ZPage.indexOf(parseInt(curSlide)) != -1)) {
					addChar = "Z";
				}	
			}
			if ((addChar == "") && (addPage.has(parseInt(curSlide)))) {
				addChar = addPage.get(parseInt(curSlide));
			}
			rectoVerso = "v";
			}
		bildAnzeigeDS();
	} else {
		window.localStorage.setItem('localStoreCurSlide', curSlide);
		window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
		window.localStorage.setItem('localStoreAddChar', addChar);
		bildAnzeigeES();
	}
}



function goPrevBook () {
	if (aktBuch > 0) {
		document.naviHSR.selectBook.selectedIndex = (--aktBuch + 1);
	} else if ((aktBuch == 1) || (curSlide > 1)) {
		document.naviHSR.selectBook.selectedIndex = (aktBuch + 1);
	} else {
		return;
	}

	var temp = document.naviHSR.selectBook.value;
			rectoVerso = temp.substring(0,1);
			addChar = '';
			curSlide = parseInt(temp.substring(1));
			if (isNaN(curSlide)) {
				addChar = temp.substring(1,2);
				curSlide = parseInt(temp.substring(2));
			}

	if (zoom==50) {
		if (rectoVerso == "r") {
			if (addPage.has(parseInt(curSlide))) {					
				if (addChar == "a") {
					curSlide--;
					addChar = "";
				} else {
					addChar = String.fromCodePoint(addChar.charCodeAt(0)-1);
					if (addChar == "j") {
						addChar = "i";
					}
				}
			} else if (addChar == "Z") {
				addChar = "";
			} else {
				curSlide--;
				if ((ZPage.indexOf(parseInt(curSlide)) != -1)) {
					addChar = "Z";
				}	
			}
			if ((addChar == "") && (addPage.has(parseInt(curSlide)))) {
				addChar = addPage.get(parseInt(curSlide));
			}
			rectoVerso = "v";
			}
		bildAnzeigeDS();
	} else {
		window.localStorage.setItem('localStoreCurSlide', curSlide);
		window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
		window.localStorage.setItem('localStoreAddChar', addChar);
		bildAnzeigeES();
	}
}





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



function goNextPage() {
	if (zoom == 50) {
		if (curSlide < lastPageDS) {
			curSlide++;
			window.localStorage.setItem('localStoreCurSlide', curSlide);
			window.localStorage.setItem('localStoreAddChar', addChar);
			//window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
			curSlide = nexSlide;
			addChar = nexChar;
			bildAnzeigeDS();
		}
	} else {
		if (!(curSlide == lastPageES && rectoVerso == lastPageRV)) {
			if (rectoVerso == "v") {
				// Slide number + additional character
				if (addPage.has(parseInt(curSlide))) {					
					if (addPage.get(parseInt(curSlide)) == addChar) {
						curSlide++;
						addChar = "";
					} else {
						addChar = String.fromCodePoint(addChar.charCodeAt(0)+1);
						if (addChar == "j") {
							addChar = "k";
						}
					}
				} else if ((addChar == "") && (ZPage.indexOf(parseInt(curSlide)) != -1)) {
					addChar = "Z";
				} else {
					curSlide++;
					addChar = ""
				}
				if ((addChar == "") && (addPage.has(parseInt(curSlide)))) {
					addChar = "a";
				}
				rectoVerso = "r";
			} else {
				rectoVerso = "v";
			}
			window.localStorage.setItem('localStoreCurSlide', curSlide);
			window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
			window.localStorage.setItem('localStoreAddChar', addChar);
			bildAnzeigeES();
		}
	}
}



function goPrevPage() {
	if (zoom == 50) {
		if (curSlide > firstPageDS) {
			if (addPage.has(parseInt(curSlide))) {					
				if (addChar == "a") {
					curSlide--;
					addChar = "";
				} else {
					addChar = String.fromCodePoint(addChar.charCodeAt(0)-1);
					if (addChar == "j") {
						addChar = "i";
					}
				}
			} else if (addChar == "Z") {
				addChar = "";
			} else {
				curSlide--;
				if ((ZPage.indexOf(parseInt(curSlide)) != -1)) {
					addChar = "Z";
				}	
			}
			if ((addChar == "") && (addPage.has(parseInt(curSlide)))) {
				addChar = addPage.get(parseInt(curSlide));
			}
			window.localStorage.setItem('localStoreCurSlide', curSlide);
			window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
			window.localStorage.setItem('localStoreAddChar', addChar);
			//window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
			bildAnzeigeDS();
		}
	} else {
		if (!((curSlide == firstPageES + 1) && (rectoVerso == firstPageRV))){
			if (rectoVerso == "r") {
				if (addPage.has(parseInt(curSlide))) {					
					if (addChar == "a") {
						curSlide--;
						addChar = "";
					} else {
						addChar = String.fromCodePoint(addChar.charCodeAt(0)-1);
						if (addChar == "j") {
							addChar = "i";
						}
					}
				} else if (addChar == "Z") {
					addChar = "";
				} else {
					curSlide--;
					if ((ZPage.indexOf(parseInt(curSlide)) != -1)) {
						addChar = "Z";
					}	
				}
				if ((addChar == "") && (addPage.has(parseInt(curSlide)))) {
					addChar = addPage.get(parseInt(curSlide));
				}
				rectoVerso = "v";
			} else {
				rectoVerso = "r";
			}
		}
		window.localStorage.setItem('localStoreCurSlide', curSlide);
		window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
		window.localStorage.setItem('localStoreAddChar', addChar);
		bildAnzeigeES();
	}
}



function checkSeitenEingabe() {

	var curSlideAlt = curSlide;
	var rectoVersoAlt = rectoVerso;
	var seitenEingabe = document.naviHSR.Blatt.value;

	if (seitenEingabe == "0" || seitenEingabe == "" || isNaN(parseInt(seitenEingabe))) {document.naviHSR.Blatt.value = ""; return}

	while (seitenEingabe.charAt(0)=="0") { //Führende 0'en abschneiden
		seitenEingabe = seitenEingabe.substring(1, seitenEingabe.length);
	}

	var temp = seitenEingabe.charAt(seitenEingabe.length - 1);

	if (temp == "r" || temp == "v") {
		addChar = ""
		curSlide = seitenEingabe.substring(0, seitenEingabe.length - 1);
		rectoVerso = seitenEingabe.substring(seitenEingabe.length - 1, seitenEingabe.length);
		if (isNaN(curSlide)) {
			addChar = seitenEingabe.substring(seitenEingabe.length - 2, seitenEingabe.length - 1);
			curSlide = seitenEingabe.substring(0, seitenEingabe.length - 2);
		}
	} else if ((seitenEingabe.charCodeAt(seitenEingabe.length - 1) > 47) && (seitenEingabe.charCodeAt(seitenEingabe.length - 1) < 58)) {
		curSlide = seitenEingabe;
		rectoVerso = "r";
		addChar = ""
	} else {alert("Bitte geben Sie eine gültige Blattanzeige ein."); return;}

		

	if (zoom == 50) {
		if (rectoVerso == "r") {
			if (addPage.has(parseInt(curSlide))) {					
				if (addChar == "a") {
					curSlide--;
					addChar = "";
				} else {
					addChar = String.fromCodePoint(addChar.charCodeAt(0)-1);
					if (addChar == "j") {
						addChar = "i";
					}
				}
			} else if (addChar == "Z") {
				addChar = "";
			} else {
				curSlide--;
				if ((ZPage.indexOf(parseInt(curSlide)) != -1)) {
					addChar = "Z";
				}	
			}
			if ((addChar == "") && (addPage.has(parseInt(curSlide)))) {
				addChar = addPage.get(parseInt(curSlide));
			}
			rectoVerso = "v";
			}

			document.naviHSR.Blatt.value = "";
			if ((curSlide > (firstPaginiert - 2)) && (curSlide < lastPaginiert)) {
				bildAnzeigeDS();
			} else {
	
				alert("Das erste paginierte Blatt der Handschrift ist Bl. " + firstPaginiert + ", das letzte paginierte Blatt ist Bl." + lastPaginiert + ". Die Vorsatzblätter und die Buchdeckel können Sie von dort aus über die Buttons \"zurück-\" bzw. \"weiterblättern\" erreichen."); curSlide = curSlideAlt; rectoVerso = rectoVersoAlt;
	
			}
		} else {
			if ((curSlide >= firstPaginiert) && (curSlide <= lastPaginiert)) {
				bildAnzeigeES();
			} else {
				alert("Das erste paginierte Blatt der Handschrift ist Bl. " + firstPaginiert + ", das letzte paginierte Blatt ist Bl. " + lastPaginiert + ". Die Vorsatzblätter und die Buchdeckel können Sie von dort aus über die Buttons \"zurück-\" bzw. \"weiterblättern\" erreichen."); curSlide = curSlideAlt; rectoVerso = rectoVersoAlt;
			}
		}
		document.naviHSR.Blatt.value = "";
	}

	async function checkVersEingabe() {
		// Hole den Wert aus dem Eingabefeld
		const versInput = parseFloat(document.naviHSR.Vers.value);
	
		// Rufe die Funktion getVersInfo() auf, um die Daten zu erhalten
		const versInfo = await getVersInfo();
	
		// Überprüfen, ob der Vers im Bereich liegt
		let foundCase = null;
		let firstVers = null;
		let lastVers = null;
	
		for (const [caseValue, start, end] of versInfo) {
			if (!firstVers || parseFloat(start) < firstVers) {
				firstVers = parseFloat(start);
			}
			if (!lastVers || parseFloat(end) > lastVers) {
				lastVers = parseFloat(end);
			}
	
			// Konvertiere start und end in Zahlen und überprüfe den Range
			const startNum = parseFloat(start);
			const endNum = parseFloat(end);
	
			if (!isNaN(startNum) && !isNaN(endNum) && versInput >= startNum && versInput <= endNum) {
				foundCase = caseValue;
				break;
			}
		}
	
		// Ausgabe basierend auf dem Ergebnis
		if (foundCase) {
	
			if (zoom == 50) {
				curSlide = foundCase;
				bildAnzeigeDS();
			}
			else {
				let match = foundCase.match(/^(\d+)([a-zA-Z])$/);
				if (match) {
					// Die Zahl und der Buchstabe werden in separate Variablen aufgeteilt
					curSlide = parseInt(match[1], 10); // Erste Gruppe: Zahl
					rectoVerso = match[2];            // Zweite Gruppe: Buchstabe
				} else {
					console.error("Ungültiges Format");
				}
				addChar = "";
				bildAnzeigeES();
			}
			document.naviHSR.Vers.value = "";
		} else {
			alert(
				`Der erste Vers ist ${firstVers}, der letzte Vers ist ${lastVers}.`
			);
		}
	}
	
	async function getVersInfo() {
		try {
			let response; // Deklariere die Variable außerhalb des Blocks
	
			// Wähle die Datei basierend auf dem Zoom-Level
			if (zoom == 50) {
				response = await fetch('blattInfoDSCgm63.js');
			} else {
				response = await fetch('blattInfoCgm63.js');
			}
	
			// Prüfen, ob die Anfrage erfolgreich war
			if (!response.ok) {
				throw new Error(`Fehler beim Laden der Datei: ${response.statusText}`);
			}
	
			// Inhalt der Datei als Text lesen
			const fileContent = await response.text();
	
			// Array, um die Ergebnisse zu speichern
			const result = [];
	
			// Regulärer Ausdruck, um die Cases und die Konkordanz zu extrahieren
			const regex = /case\s+"([^"]+)":.*?konkordanz="([^"]*)"/g;
	
			let match;
			while ((match = regex.exec(fileContent)) !== null) {
				const caseValue = match[1]; // Wert nach `case`
				const konkordanz = match[2]; // Wert der Konkordanz
	
				if (konkordanz.includes('-')) {
					// Split Konkordanz in zwei Teile
					const [start, end] = konkordanz.split('-');
					result.push([caseValue, start, end]);
				} else {
					// Keine Split-Werte, nur den Case-Wert hinzufügen
					result.push([caseValue, konkordanz, ""]);
				}
			}
	
			return result;
		} catch (error) {
			console.error("Fehler beim Verarbeiten der Datei:", error);
			return [];
		}
	}

function bildAnzeigeZoom() {
	//alert ("localZoom: " + window.localStorage.getItem('localStoreCurSlide'));
	var blatt = curSlide + addChar + rectoVerso + "";
	blattInfo(blatt);
	var lageTxt = ". Lage, ";
	if (lagenNr != '') {
		lagenNr = lagenNr + lageTxt;
	}

	// Zusammensetzen des Dateinamens der Bilder

	var curSlideStr = curSlide += '';
	
	switch (curSlideStr.length) {

		case 1: zusatz = "00"; break;
		case 2: zusatz = "0"; break;
		default: zusatz = ""; break;

	}

	var temp = "T" + zusatz + curSlide + addChar + rectoVerso;

	switch (curSlide) {

		//case "0": seitenAngabe = "Vorsatzbl. / Bl. Ir"; lagenAngabe = ""; temp = "R000"; buchAuswahl = 0; break;
		//case "1": seitenAngabe = "Bl. Iv / Bl. " + curSlide + "r"; lagenAngabe = lagenNr + lageTxt + lagenName; buchAuswahl = 2; break;
		//case "181": seitenAngabe = "Bl. " + (curSlide-1) + "v / Vorsatzbl."; lagenAngabe = ""; buchAuswahl = aktBuch + 1; break;
		//case "182": seitenAngabe = "Vorsatzbl. / Buchdeckel"; lagenAngabe = ""; temp = "R182"; buchAuswahl = 0; break;
		//case "183": seitenAngabe = "Buchdeckel außen"; lagenAngabe = ""; temp = "R183"; buchAuswahl = 18; break;
		//case "-1": seitenAngabe = "Buchdeckel / Vorsatzbl."; lagenAngabe = ""; temp = "Rvs001"; buchAuswahl = 0; break;
		//case "-2": seitenAngabe = "Buchdeckel vorne"; lagenAngabe = ""; temp = "Rvs002"; buchAuswahl = 1; break;
		default: seitenAngabe = "Bl. " + blatt; lagenAngabe = lagenNr + lagenName; buchAuswahl = aktBuch + 1; break;

	}	
	
	Z.showImage("myContainer", temp, "zLogoVisible=0");
	
	// Befüllen der Textfelder für Blatt- und Versnummer sowie der Lage bzw. des Lagensymbols
	document.getElementById('blattAnzeige').innerHTML = seitenAngabe;
	document.getElementById('versAnzeige').innerHTML = konkordanz;
	document.getElementById('lagenAnzeige').innerHTML = lagenAngabe;
	window.document.ImgLagensymbol.src = "../images/LagensymboleDoppelt/" + lagenSymb + ".gif";
	document.naviHSR.selectBook.selectedIndex = buchAuswahl;

	//if (imgDescr) {

		//window.document.getElementById('bildbeschreibung').style.visibility='visible';  
		//window.document.getElementById('miniaturansicht').style.visibility='visible';
		//window.document.getElementById('bildbeschreibungHell').style.visibility='hidden';  
		//window.document.getElementById('miniaturansichtHell').style.visibility='hidden';

	//} else {

		//window.document.getElementById('bildbeschreibung').style.visibility='hidden';  
		//window.document.getElementById('miniaturansicht').style.visibility='hidden';
		//window.document.getElementById('bildbeschreibungHell').style.visibility='visible';  
		//window.document.getElementById('miniaturansichtHell').style.visibility='visible';

	//}

	window.defaultStatus = "Berner Parzival-Handschrift, " + seitenAngabe;	

}

function transformAndPadNumberES(input) {
    // Extrahiere die Zahl und den Buchstaben
    const pageNum = parseInt(input.slice(0, -1), 10);
    const pageSide = input.slice(-1);

    // Berechne den Index basierend auf der Seite und der Reihenfolge
    // Startwert für '1r' soll 5 sein
    const baseNumber = (pageNum - 1) * 2 + (pageSide === 'r' ? 1 : 2);
    const result = baseNumber + 4; // Offset hinzufügen, um bei 5 zu beginnen

    // Formatierung mit führenden Nullen auf 5 Stellen
    const paddedNumber = result.toString().padStart(5, '0');
    
    return paddedNumber;
}

function transformZoomES(input) {
	if (input >= 125){
		return 1920
	}
	else {
		return 1280
	}
}

function bildAnzeigeES() {
	if (((curSlide >= firstPageES) && (curSlide < lastPageES + 1))) {
		var blatt = curSlide + addChar + rectoVerso + "";
		console.log(blatt);
		var iiifSlide = transformAndPadNumberES(blatt);
		console.log(iiifSlide);
		blattInfo(blatt);
		var lageTxt = ". Lage, ";
		if (lagenNr != '') {
			lagenNr = lagenNr + lageTxt;
		}
		var curSlideStr = curSlide += '';
		switch (curSlideStr.length) {
			case 1: zusatz = "00"; break;
			case 2: zusatz = "0"; break;
			default: zusatz = ""; break;
		}		

		// Bildname und Pfad ermitteln und Bild laden

		var temp = "T" + zusatz + curSlide + addChar + rectoVerso;
		//bildURL = zoom + "/" + temp + ".jpg";
		
		console.log(zoom);
		var iiifZoom = transformZoomES(zoom);

		bildURL = "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_" + iiifSlide + "/full/," + iiifZoom + "/0/default.jpg";
		//alert("bildURL: " + bildURL);
		fenVer = curSlide + addChar + rectoVerso;
		fenKom = curSlide + addChar + rectoVerso;
		if (alt == '') {
			blattalt = blatt;
		} else {
			blattalt = blatt + ' (alt ' + alt + ')'
		}
		
		switch (blatt) {

			//case "0v": blattAngabe = "Iv"; lagenAngabe = ""; buchAuswahl = 0; break;
			//case "0r": blattAngabe = "Ir"; lagenAngabe = ""; buchAuswahl = 0; break;
			//case "-2v": blattAngabe = "Buchdeckel"; lagenAngabe = ""; bildURL = "../RBilder/" + zoom + "/Rvs002v.jpg"; buchAuswahl = 0; break;
			//case "-2r": blattAngabe = "Buchdeckel vorne"; lagenAngabe = ""; bildURL = "../RBilder/" + zoom + "/Rvs002r.jpg"; buchAuswahl = 1; break;
			//case "181r": blattAngabe = "Vorsatzblatt"; lagenAngabe = ""; buchAuswahl = 0; break;
			//case "181v": blattAngabe = "Vorsatzblatt"; lagenAngabe = ""; buchAuswahl = 0; break;
			//case "182r": blattAngabe = "Buchdeckel"; lagenAngabe = ""; buchAuswahl = 0; break;
			//case "182v": blattAngabe = "Buchdeckel außen"; lagenAngabe = ""; buchAuswahl = 18; break;
			//case "0v": blattAngabe = "Vorsatzblatt_v"; lagenAngabe = lagenNr + lagenName; buchAuswahl = aktBuch + 1; break;
			//case "0r": blattAngabe = "Vorsatzblatt_r"; lagenAngabe = lagenNr + lagenName; buchAuswahl = aktBuch + 1; break;
			case "-1r": blattAngabe = "Einband vorne außen"; lagenAngabe = ""; bildURL = "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_00001/full/," + iiifZoom + "/0/default.jpg"; buchAuswahl = aktBuch + 1; break;
			case "-1v": blattAngabe = "Einband vorne innen"; lagenAngabe = ""; bildURL = "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_00002/full/," + iiifZoom + "/0/default.jpg"; buchAuswahl = aktBuch + 1; break;
			case "-0r": blattAngabe = "Vorsatzblatt"; lagenAngabe = ""; bildURL = "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_00003/full/," + iiifZoom + "/0/default.jpg"; buchAuswahl = aktBuch + 1; break;
			case "112r": blattAngabe = "112r"; lagenAngabe = "";  buchAuswahl = aktBuch + 1; break;
			case "112v": blattAngabe = "112v"; lagenAngabe = "";  buchAuswahl = aktBuch + 1; break;
			case "113r": blattAngabe = "Einband hinten innen"; lagenAngabe = "";  buchAuswahl = aktBuch + 1; break;
			case "113v": blattAngabe = "Einband hinten außen"; lagenAngabe = "";  buchAuswahl = aktBuch + 1; break;
			//case "-1v": blattAngabe = "Einband vorne innen"; lagenAngabe = ""; bildURL = zoom + "/Wellcome49_00Einband_vorne_innen.jpg"; buchAuswahl = aktBuch + 1; break;
			//case "": blattAngabe = "Einband hinten innen"; lagenAngabe = ""; bildURL = zoom + "/Wellcome49_00Einband_hinten_innen.jpg"; buchAuswahl = aktBuch + 1; break;
			//case "": blattAngabe = "Einband hinten aussen"; lagenAngabe = ""; bildURL = zoom + "/Wellcome49_00Einband_hinten_aussen.jpg"; buchAuswahl = aktBuch + 1; break;
			//case "": blattAngabe = "Einband Ruecken"; lagenAngabe = ""; bildURL = zoom + "/Wellcome49_00Einband_Ruecken.jpg"; buchAuswahl = aktBuch + 1; break;
			default: blattAngabe = "Bl. " + blattalt; lagenAngabe = lagenNr + lagenName; buchAuswahl = aktBuch + 1; break;
			
		
		}

		

		document.getElementById('versAnzeige').innerHTML = konkordanz;
		document.getElementById('schreibAnzeige').innerHTML = schreiber;
		document.getElementById('blattAnzeige').innerHTML = blattAngabe;
		document.getElementById('lagenAnzeige').innerHTML = lagenAngabe;
		window.document.ImgLagensymbol.src = "../Lagensymbole/Einzelseite/" + lagenSymb + ".gif";
		document.naviHSR.selectBook.selectedIndex = buchAuswahl;
		document.images['imgFaksimilev'].src = "../Lagensymbole/Einzelseite/blind.gif";
		document.images['imgFaksimiler'].src = "../Lagensymbole/Einzelseite/blind.gif";
		document.images['imgFaksimile'].src = bildURL;
		
	if (imgKom) {
		window.document.getElementById('bildbeschreibung').style.visibility='visible'; 
		window.document.getElementById('bildbeschreibungHell').style.visibility='hidden';  
	} else {
		window.document.getElementById('bildbeschreibung').style.visibility='hidden'; 
		window.document.getElementById('bildbeschreibungHell').style.visibility='visible';  
	}

	if (imgVer) {
		window.document.getElementById('miniaturansicht').style.visibility='visible';
		window.document.getElementById('miniaturansichtHell').style.visibility='hidden';
	} else {
		window.document.getElementById('miniaturansicht').style.visibility='hidden';
		window.document.getElementById('miniaturansichtHell').style.visibility='visible';
	}

		window.document.getElementById('zoomminus').style.visibility='visible';
		window.document.getElementById('zoomminusHell').style.visibility='hidden';
		window.document.getElementById('zoomplus').style.visibility='visible';
		window.document.getElementById('zoomplusHell').style.visibility='hidden';

		window.defaultStatus = "Berner Parzival-Handschrift, " + blattAngabe + "  |  Bildgr" + oesz +"e: " + zoom + "%";return true;
	}	
}

function transformAndPadNumberDS(input) {
    // Transformation der Eingabezahl
    let transformedNumber = 2 * input + 4;
    
    // Formatierung mit führenden Nullen auf 5 Stellen
    let paddedNumber = transformedNumber.toString().padStart(5, '0');
    
    return paddedNumber;
}


function bildAnzeigeDS() {
	var curSlideStr = curSlide += '';

	nexSlide = curSlide
	nexChar = addChar
	if (addPage.has(parseInt(nexSlide))) {					
		if (addPage.get(parseInt(nexSlide)) == nexChar) {
			nexSlide++;
			nexChar = "";
		} else {
			nexChar = String.fromCodePoint(nexChar.charCodeAt(0)+1);
			if (nexChar == "j") {
				nexChar = "k";
			}
		}
	} else if ((nexChar == "") && (ZPage.indexOf(parseInt(nexSlide)) != -1)) {
		nexChar = "Z";
	} else {
		nexSlide++;
		nexChar = ""
		}
	if ((nexChar == "") && (addPage.has(parseInt(nexSlide)))) {
		nexChar = "a";
	}
	
	var curSlideStr = curSlide += '';
	switch (curSlideStr.length) {
		case 1: var zusatzv = "00"; break;
		case 2: var zusatzv = "0"; break;
		default: var zusatzv = ""; break;
	}
	
	var nexSlideStr = nexSlide += '';
	switch (nexSlideStr.length) {
		case 1: var zusatzr = "00"; break;
		case 2: var zusatzr = "0"; break;
		default: var zusatzr = ""; break;
	}
	
	var tempv = "T" + zusatzv + curSlide + addChar + 'v';
	var tempr = "T" + zusatzr + nexSlide + nexChar + 'r';
	//var bildURLv = "50/" + tempv + ".jpg";
	//var bildURLr = "50/" + tempr + ".jpg";

	var iiifSlidev = transformAndPadNumberDS(curSlide);
	var iiifSlider = (parseInt(iiifSlidev, 10) + 1).toString().padStart(iiifSlidev.length, '0');


	//console.log(iiifSlider); 
	
	var bildURLv = "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_" + iiifSlidev + "/full/,640/0/default.jpg";
	var bildURLr = "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_" + iiifSlider + "/full/,640/0/default.jpg";
	
	switch (curSlide) {

		case "-2":  
			bildURLv = "50/transparent.png";
			bildURLr = "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_00001/full/,640/0/default.jpg"; break;

		case "-1":  
			bildURLv = "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_00002/full/,640/0/default.jpg";
			bildURLr = "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00102987_00003/full/,640/0/default.jpg"; break;


		/*case "114":  
			bildURLv = "50/T114v.jpg";
			bildURLr = "50/transparent.png"; break;

		case "70":  
			bildURLv = "50/Wellcome49_070v.jpg";
			bildURLr = "50/Wellcome49_00Einband_hinten_innen.jpg"; break;
		case "71":  
			bildURLv = "50/Wellcome49_00Einband_hinten_aussen.jpg";
			bildURLr = "Wellcome49_00Einband_Ruecken.jpg"; break;*/
		default: break;



	}
	//alert("bildURLv: " + bildURLv + "bildURLr: " + bildURLr);
	var rvKom = 0
	var rvVer = 0

	var blatt = curSlide + addChar + "v";
	blattInfo(blatt); // Info Verso
	var schreibv = schreiber
    if 	(imgKom) {
		rvKom = 1
	} 
    if 	(imgVer) {
		rvVer = 1
	}
	
	blatt = nexSlide + nexChar + "r";
	blattInfo(blatt); // Info Recto
	var schreibr = schreiber
    if 	(imgKom) {
		rvKom = 2
	} 
    if 	(imgVer) {
		rvVer = 2
	} 
	
	if (schreibv == schreibr) {
		schreiber = schreibv
	}
	else {
		schreiber = schreibv +" / "+schreibr
	}
	
	blatt = curSlide + addChar + "";
	blattInfoDS(blatt); //Info Recto/Verso
	var lageTxt = ". Lage, ";
	if (lagenNr != '') {
		lagenNr = lagenNr + lageTxt;
	}
	
	switch (curSlide) {

		case "-2": seitenAngabe = "Einband vorne außen"; lagenAngabe = ""; buchAuswahl = aktBuch + 1; break;
		case "-1": seitenAngabe = "Einband vorne innen"; lagenAngabe = ""; buchAuswahl = aktBuch + 1; break;
		case "0": seitenAngabe = "Bl. 1r"; lagenAngabe = lagenNr + lagenName; schreiber="Schreiber 3"; buchAuswahl = aktBuch + 1; break;
		case "111": schreiber="Schreiber 3"; break;
		case "112": seitenAngabe = "Einband hinten innen"; lagenAngabe = ""; buchAuswahl = aktBuch + 1; break;
		case "113": seitenAngabe = "Einband hinten außen"; lagenAngabe = ""; buchAuswahl = aktBuch + 1; break;
		case "114": seitenAngabe = "Seitenansicht"; lagenAngabe = ""; buchAuswahl = aktBuch + 1; break;
		case "115": seitenAngabe = ""; lagenAngabe = ""; buchAuswahl = aktBuch + 1; break;
		//case "1": seitenAngabe = "Bl. Iv / Bl. " + curSlide + "r"; lagenAngabe = lagenNr + lageTxt + lagenName; buchAuswahl = 2; break;
		//case "181": seitenAngabe = "Bl. " + (curSlide-1) + "v / Vorsatzbl."; lagenAngabe = ""; buchAuswahl = aktBuch + 1; break;
		//case "182": seitenAngabe = "Vorsatzbl. / Buchdeckel"; lagenAngabe = ""; buchAuswahl = 0; break;
		//case "183": seitenAngabe = "Buchdeckel außen"; lagenAngabe = ""; buchAuswahl = 18; break;
		//case "-1": seitenAngabe = "Buchdeckel / Vorsatzbl."; lagenAngabe = ""; bildURL = "../RBilder/50/Rvs001.jpg"; buchAuswahl = 0; break;
		//case "-2": seitenAngabe = "Buchdeckel vorne"; lagenAngabe = ""; bildURL = "../RBilder/50/Rvs002.jpg"; buchAuswahl = 1; break;
		//case "-1": seitenAngabe = "Einband vorne innen / Vorsatzblatt_r"; lagenAngabe = lagenNr + lagenName; buchAuswahl = aktBuch + 1; break;
		//case "0": seitenAngabe = "Vorsatzblatt_v"+ " / " + nexSlide + nexChar + "r"; lagenAngabe = lagenNr + lagenName; buchAuswahl = aktBuch + 1; break;
		//case "72": seitenAngabe = "Bl. " + curSlide + addChar + "v / Einband hinten innen"; lagenAngabe = lagenNr + lagenName; buchAuswahl = aktBuch + 1; break;
		//case "73": seitenAngabe = "Einband hinten aussen / Einband Ruecken"; lagenAngabe = lagenNr + lagenName; buchAuswahl = aktBuch + 1; break;
		
		default: seitenAngabe = "Bl. " + curSlide + addChar + "v / " + nexSlide + nexChar + "r"; lagenAngabe = lagenNr + lagenName; buchAuswahl = aktBuch + 1; break;

	}

	document.getElementById('blattAnzeige').innerHTML = seitenAngabe;
	document.getElementById('versAnzeige').innerHTML = konkordanz;
	document.getElementById('schreibAnzeige').innerHTML = schreiber;
	window.document.ImgLagensymbol.src = "../Lagensymbole/Doppelseite/" + lagenSymb + ".gif";
	document.getElementById('lagenAnzeige').innerHTML = lagenAngabe;
	document.naviHSR.selectBook.selectedIndex = buchAuswahl;
	document.images['imgFaksimile'].src = "../Lagensymbole/Doppelseite/blind.gif";
	document.images['imgFaksimilev'].src = bildURLv;
	document.images['imgFaksimiler'].src = bildURLr;

	if (rvKom != 0) {
		window.document.getElementById('bildbeschreibung').style.visibility='visible'; 
		window.document.getElementById('bildbeschreibungHell').style.visibility='hidden';
		if (rvKom == 1) {
			fenKom = curSlide + addChar + 'v';
		}
		else {
			fenKom = nexSlide + nexChar + 'r'
		}
	} else {
		window.document.getElementById('bildbeschreibung').style.visibility='hidden'; 
		window.document.getElementById('bildbeschreibungHell').style.visibility='visible';  
	}

	if (rvVer != 0) {
		window.document.getElementById('miniaturansicht').style.visibility='visible';
		window.document.getElementById('miniaturansichtHell').style.visibility='hidden';
		if (rvVer == 1) {
			fenVer = curSlide + addChar + 'v';
		}
		else {
			fenVer = nexSlide + nexChar + 'r'
		}
	} else {
		window.document.getElementById('miniaturansicht').style.visibility='hidden';
		window.document.getElementById('miniaturansichtHell').style.visibility='visible';
	}

	window.document.getElementById('zoomminus').style.visibility='hidden';
	window.document.getElementById('zoomminusHell').style.visibility='visible';
	window.document.getElementById('zoomplus').style.visibility='hidden';
	window.document.getElementById('zoomplusHell').style.visibility='visible';

	window.defaultStatus = "Berner Parzival-Handschrift, " + seitenAngabe + "  |  Bildgr" + oesz +"e: " + zoom + "%";

	// IIIF/OpenSeadragon: bildURLv/bildURLr are full Munich IIIF image URLs
	// (…/full/,640/0/default.jpg) or transparent.png. Hand them to the shared
	// OSD wrapper, which rewrites them to the service info.json for deep zoom.
	if (typeof renderSpread === 'function') {
		renderSpread('osdSpread', bildURLv, bildURLr);
	}
	return true;
}


function zoom150() {
	document.getElementById("imgFaksimile").style.width = "auto";
	switch (Number(zoom)) {

		//case 50: if((curSlide == "-2") && (rectoVerso == "r")) {break;} else {rectoVerso ="v"; curSlide--;	linkeSeite = curSlide + rectoVerso;	break;}
		case 50: break
		case 100: break;
		case 150: return; break;

	}
	if(curSlide==0){
		curSlide++;
		rectoVerso="r";
		console.log(curSlide);
	}

	zoom = 150; 
	bildAnzeigeES();
}


function zoom100() {
	document.getElementById("imgFaksimile").style.width = "auto";
	switch (Number(zoom)) {

		case 50: 
		//if((curSlide == "-2") && (rectoVerso == "r")) {
			break;
		//} else {
		//	rectoVerso ="v"; 
		//	curSlide--;	
		//	linkeSeite = curSlide + rectoVerso;	
		//	break;
		//}
		case 100: return; break;
		case 150: break;
	}
	if(curSlide==0){
		curSlide++;
		rectoVerso="r";
		console.log(curSlide);
	}
		
	zoom = 100;
	bildAnzeigeES();	
}


function zoom50() {

	//switch (true) {

		//case  Number(zoom) > 50: if (rectoVerso == "v") {curSlide++}; break;
		//case  Number(zoom) == 50: return; break;

	//}

	if ((rectoVerso == "r") && (curSlide > 0)){
		if (addPage.has(parseInt(curSlide))) {					
			if (addChar == "a") {
				curSlide--;
				addChar = "";
			} else {
				addChar = String.fromCodePoint(addChar.charCodeAt(0)-1);
				if (addChar == "j") {
					addChar = "i";
				}
			}
		} else if (addChar == "Z") {
			addChar = "";
		} else {
			curSlide--;
			if ((ZPage.indexOf(parseInt(curSlide)) != -1)) {
				addChar = "Z";
			}	
		}
		if ((addChar == "") && (addPage.has(parseInt(curSlide)))) {
			addChar = addPage.get(parseInt(curSlide));
		}
		rectoVerso = "v";
		}
	zoom = 50;
	bildAnzeigeDS();
}

function ansichtKonv() {
	//
	if ((String(window.location).indexOf("material") != -1) || (String(window.location).indexOf("einfuehrung") != -1)) {
		window.localStorage.setItem('localStoreCurSlide', '1');
		window.localStorage.setItem('localStoreAnsicht', 'konv');
		window.localStorage.setItem('localStoreZoomStufe', 50);
		window.localStorage.setItem('localStoreRectoVerso', 'doppelseitig');
		window.localStorage.setItem('localStoreAddChar', '');
		curSlide = '1';
		zoom = 100;
		//alert("material");

	} else {
		window.localStorage.setItem('localStoreCurSlide', curSlide);
		window.localStorage.setItem('localStoreAnsicht', "konv");
		window.localStorage.setItem('localStoreZoomstufe', zoom);
		window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
		window.localStorage.setItem('localStoreAddChar', '');
		//alert("nicht material");
	}
	//alert("curSlide: " + curSlide);
	//alert("rectoVerso in ansichtKonv: " + rectoVerso + "; curSlide " + curSlide);
	var url_konv = "konventionellG.html";

	if (Number(zoom) == 50) {
		curSlide = curSlide;
	} else if ((Number(zoom) != 50) && (rectoVerso == "v" )) {
		curSlide = -- curSlide;
		//rectoVerso = "v";
	}
	
	
	
	//alert("local: " + window.localStorage.getItem('localStoreCurSlide'));
	window.location.href = url_konv;

}

function ansichtZoom() {

	var url_zoom = "zoomifyG.html";

	//if ((zoom != 50) && (rectoVerso == "v")) {
	//	curSlide = ++curSlide;
	//} else {
	//	curSlide = curSlide;
	//}
	curSlide = curSlide;
	window.localStorage.setItem('localStoreCurSlide', curSlide);
	window.localStorage.setItem('localStoreAnsicht', "zoom");
	window.localStorage.setItem('localStoreZoomStufe', zoom);
	window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
	window.localStorage.setItem('localStoreAddChar', addPage);
	
	//alert("localStorage Zoomstufe: " + window.localStorage.getItem('localStoreZoomStufe'));
	window.location.href = url_zoom;
}


function ansichtMiniatur() {
	//alert("curSlide: " + curSlide + ", zoom: " + zoom + ", rectoVerso: " + rectoVerso);
	var url_miniatur = "miniaturen.html";
	curSlide = window.localStorage.getItem('localStoreCurSlide');
	ansicht = window.localStorage.getItem('localStoreAnsicht');
	zoom = window.localStorage.getItem('localStoreZoomStufe');
	rectoVerso = window.localStorage.getItem('localStoreRectoVerso');
		
	if(zoom == 50) {
		if ((curSlide == "8") || (curSlide == "20") || (curSlide == "21") || (curSlide == "23") || (curSlide == "38") || (curSlide == "47") || (curSlide == "56") || (curSlide == "118") || (curSlide == "126") || (curSlide == "128")) {
			rectoVerso = "r";
		} else {
			rectoVerso = "v"; curSlide--;
		}
	} else {
		rectoVerso = rectoVerso;
	}
	
	window.localStorage.setItem('localStoreCurSlide', curSlide);
	window.localStorage.setItem('localStoreAnsicht', "miniatur");
	window.localStorage.setItem('localStoreZoomStufe', zoom);
	window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
	//alert("zoom: " + zoom + " ; curSlide: " + curSlide + "; rectoVerso: " + rectoVerso);
	window.location.href = url_miniatur;
}

function ansichtMiniaturStart() {
	
	if (String(window.location).indexOf("Daten") != -1) {
		var url_miniatur = "miniaturen.html";
	} else {
		var url_miniatur = "Daten/miniaturen.html";
	}
	
	curSlide = "8";
	rectoVerso = "r";
	zoom = "50";
	
	window.localStorage.setItem('localStoreCurSlide', curSlide);
	window.localStorage.setItem('localStoreAnsicht', "miniatur");
	window.localStorage.setItem('localStoreZoomStufe', zoom);
	window.localStorage.setItem('localStoreRectoVerso', rectoVerso);
	//alert("zoom: " + zoom + " ; curSlide: " + curSlide + "; rectoVerso: " + rectoVerso);
	//alert("localStorage Zoomstufe: " + window.localStorage.getItem('localStoreZoomStufe'));
	window.location.href = url_miniatur;
}


function ansichtMiniaturen() {

	var url_nav = "navigation_miniaturen.html";
	var url_img = "image_miniatur.html";
	parent.curSlideX = curSlide;
	parent.zoomX = zoom;

	if(zoom == 50) {
		if ((curSlide == "8") || (curSlide == "20") || (curSlide == "21") || (curSlide == "23") || (curSlide == "38") || (curSlide == "47") || (curSlide == "56") || (curSlide == "118") || (curSlide == "126") || (curSlide == "128")) {
			parent.rectoVersoX = "r";
		} else {
			parent.rectoVersoX = "v"; parent.curSlideX--;
		}
	} else {
		parent.rectoVersoX = rectoVerso;
	}
	parent.RImage.location.href = url_img;
	parent.navigation.location.href = url_nav;

}


function bildAnsichtKonv() {
	
	// Prüfen auf Parameter
	
	var strHref = window.location.href;
	// wenn Parameter für Seite angegeben werden
	if (strHref.indexOf("?") > -1 ){
		//alert("parameter");
    	var strQueryString = strHref.substr(strHref.indexOf("?") + 1).toLowerCase();
		var aQueryString = strQueryString.split("&");
		var strQueryBlatt = aQueryString[0];
		var strQueryGroesse = aQueryString[1];
		var strQueryAnsicht = aQueryString[2];
		
		for (i = 0; i < 2; i++) {
			if (strQueryBlatt.charAt(0)=="0") {
				strQueryBlatt = strQueryBlatt.substring(1, strQueryBlatt.length);
			}
		}
		addChar = ""
		curSlide = strQueryBlatt.substring(0, strQueryBlatt.length - 1);		
		rectoVerso = strQueryBlatt.substring(strQueryBlatt.length - 1, strQueryBlatt.length);
		zoom = Number(strQueryGroesse);
		if (isNaN(curSlide)) {
			addChar = strQueryBlatt.substring(strQueryBlatt.length - 2, strQueryBlatt.length - 1);
			curSlide = strQueryBlatt.substring(0, strQueryBlatt.length - 2);
		}
		if (isNaN(strQueryGroesse)) {
			zoom = 100;
		} else {
			zoom = Number(strQueryGroesse);
		}
		if (zoom == 50 && rectoVerso == "v") {
			curSlide = ++curSlide;
		}
		//alert("curSlide: " + curSlide + " rectoVerso: " + rectoVerso + " zoom: " + zoom);
		/*if (strQueryAnsicht == "cod") {
			window.RImage.location.href = "image_konv.html";
			window.frames["navigation"].location.href = "navigation_konv.html";
			ansicht = "konv";
		} else {
			window.RImage.location.href = "image_miniatur.html";
			window.navigation.location.href = "navigation_miniaturen.html";
			ansicht = "miniatur";
		}*/
	} 
	
	//alert("curSlide: " + curSlide + ", ansicht: " + ansicht + ", zoomStufe: " + zoom + ", rectoVerso: " + rectoVerso);
	if (zoom == 50) {
		//alert("doppelseitig");
		bildAnzeigeDS();
	} else {
		//alert("einseitig");
		bildAnzeigeES();
	}
}

/*
function importXML() {
	//alert("Nicht erschrecken :o) konventionelle Ansicht");
	if (document.implementation && document.implementation.createDocument) {
		xmlDoc = document.implementation.createDocument("", "", null);
		xmlDoc.onload = xmlLoaded;
	} else if (window.ActiveXObject) {
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.onreadystatechange = function () {
			if (xmlDoc.readyState == 4) xmlLoaded()
		};
 	}
	else
	{
		alert('Your browser can\'t handle this script');
		return;
	}
	xmlDoc.load(xmlURL);
}
*/

function importXML() {
	var xmlURL = "bildverz.xml";
	 // Eine Verbindung zurm XML-Dokument aufbauen
  	var Connect = new XMLHttpRequest();
  	// einzulesendes XML-Dokument definieren und Anfrage senden
  	Connect.open("GET", xmlURL, false);
  	Connect.setRequestHeader("Content-Type", "text/xml");
  	Connect.send(null);
  	// Die Antwort in einem XML-Dokument speichern
  	var xmlDoc = Connect.responseXML;
  	// Das Wurzelelement in einer Variable speichern
  	bildbeschreibungen = xmlDoc.childNodes[0];
	
	//alert("erster Knoten 5: " + bildbeschreibungen.children[1].getElementsByTagName('tit1')[0].firstChild.nodeValue);
	//var titel = bildbeschreibungen.illustration[1].getElementsByTagName('tit1')[0].firstChild.nodeValue;
	
}

function localXML() {
	var txt, parser, xmlDoc;
	txt = "<radix>"+
	"<illustration blatt='175v' nr='1'>"+
		"<tit1> </tit1>"+
		"<rub> </rub>"+
		"<transl> </transl>"+
		"<descr>Verweis 1: Vide pl(us) de Sÿbill(is) jn occulto a k(arta) 253 . 273 . 274 . 291 . 294.&lt;br&gt;&lt;br&gt;Verweis 2: Et jn Bocacio de Ca#.sib(us) viro(rum) jllu#.st(ri)u(m) a k(arta) ret(ro) de Sibilla Cu-|mana.Cumana  Erithrea [Wolfenbüttel, Herzog August Bibliothek, Cod. Guelf. 36.19 Aug. 2°, Bl. 181r–188v].&lt;br&gt;&lt;br&gt;</descr>"+
	"</illustration>"+
	"<illustration blatt='176r' nr='2'>"+
		"<tit1> </tit1>"+
		"<rub> </rub>"+
		"<transl> </transl>"+
		"<descr>Notat : Incipit p(ri)m(us) liber Sibille vatis Cumane. | (et) alie comp(re)hundun(tur) #.sub h(uius) no(m)i(n)e potior(is) Cumane (etc) | q(ue) #.se ip#.sa(m) no(m)i(n)at p(ostea) v(er)#.su .81.&lt;br&gt;&lt;br&gt;</descr>"+ 
	"</illustration>"+
	"</radix>";
	parser = new DOMParser();
	xmlDoc = parser.parseFromString(txt,"text/xml");
	bildbeschreibungen = xmlDoc.childNodes[0];
}

function xmlLoaded() {
	return true;
}



function init() {
	
	importXML();
	if (zoom == 50) {
		bildAnzeigeDS();
	} else {
		bildAnzeigeES();
	}
}





function beschreibungAnzeigen(folio) {

	var pfad=self.document.URL;
	var backslash = unescape("%5C");

	if (pfad.indexOf(backslash) != -1) {
		pfad = pfad.replace(/\\/g,"/");
	}

	var temp = pfad.indexOf("Daten");
	var pfadVariabel = pfad.substring(0, temp);
	//alert(pfadVariabel);
	//var cssURL = pfadVariabel + "Daten/css/synopse.css";
	//var printImgURL = pfadVariabel + "images/print.jpg";
	//var jsURL = pfadVariabel + "Daten/RScripts/print.js";
	var illustration = bildbeschreibungen.getElementsByTagName('illustration');
	var cssURL = "./css/synopse.css";
	var printImgURL = "../images/print.jpg";
	var jsURL = "print.js";
	//var illustration = xmlDoc.getElementsByTagName('illustration');
	var titel,rubrizierung,uebersetzung,beschreibung,illustrationNr;
	var content = "";
	//alert(illustration);
	for (i = 0; i < 2; i++ ) {
		if (zoom == 50) {
			if ((illustration[i].attributes[0].nodeValue == curSlide + "r") || (illustration[i].attributes[0].nodeValue == (curSlide -1) + "v")) {
				titel = illustration[i].getElementsByTagName('tit1')[0].firstChild.nodeValue;
				rubrizierung = illustration[i].getElementsByTagName('rub')[0].firstChild.nodeValue;
				uebersetzung = illustration[i].getElementsByTagName('transl')[0].firstChild.nodeValue;
				beschreibung = illustration[i].getElementsByTagName('descr')[0].firstChild.nodeValue;		
				illustrationNr = "Illustration " + illustration[i].attributes[1].nodeValue;

				//if ((curSlide == 58) || (curSlide == 62)) {
					//illustrationNr = "Illustrationen " + illustration[i - 1].attributes[1].nodeValue + " und " + illustration[i].attributes[1].nodeValue;
				//}

				content += '<div class=\"bildtitel\">' + titel + '</div>';
 				content += '<div class=\"tit\">' + rubrizierung + '</div>';
				content += '<div class=\"rp\">' + uebersetzung + '</div>';
				content += '<div class=\"bildbeschreibung\">' + beschreibung + '</div>';

			}

		} else {

			if (illustration[i].attributes[0].nodeValue == curSlide + rectoVerso) {
				titel = illustration[i].getElementsByTagName('tit1')[0].firstChild.nodeValue;
				rubrizierung = illustration[i].getElementsByTagName('rub')[0].firstChild.nodeValue;
				uebersetzung = illustration[i].getElementsByTagName('transl')[0].firstChild.nodeValue;
				beschreibung = illustration[i].getElementsByTagName('descr')[0].firstChild.nodeValue;
				illustrationNr = "Illustration " + illustration[i].attributes[1].nodeValue;
				content += '<div class=\"bildtitel\">' + titel + '</div>';
 				content += '<div class=\"tit\">' + rubrizierung + '</div>';
				content += '<div class=\"rp\">' + uebersetzung + '</div>';
				content += '<div class=\"bildbeschreibung\">' + beschreibung + '</div>';

			}
		}
	}

 	content += '<div align=\"center\"><a href=\"javascript:doPrint()\"><img id=\"drucken\" src=\"' + printImgURL + '\" width=\"55\" height=\"34\" border=\"0\"></a></div><br><form name=\"form1\" action=\"\"><center><input type=\"submit\" name=\"schliessen\" value=\"Fenster schließen\" onClick=\"javascript:self.close()\" class=\"Button\"></center></form></body>'
 	content += '</html>';
	var descrHeader = '<html><head><title>' + illustrationNr + '</title><script src=\"' + jsURL + '\" type=\"text/javascript\"></script><link rel=\"stylesheet\" type=\"text/css\" href=\"' + cssURL + '\"></head><body>';
	var breite = 360;
	var hoehe = 600;
	var xPos = screen.width - (breite + 30);
	var yPos = 200;
	var fenster = window.open("", "Bildbeschreibung", "menubar=no,toolbar=no,scrollbars=yes,locationbar=no,directories=no,resizable=yes,width="+ breite + ",height=" + hoehe +",screenX=" + xPos + ",screenY=" + yPos + ",left=" + xPos + ",top=" + yPos + ",status=no");

	if (fenster != 0) {
		fenster.document.open();
 		fenster.document.write(descrHeader + content);
 		fenster.document.close();
	}

	if (fenster.window != focus()) {fenster.window.focus()};
}



function systemWeiche() {

	agt=navigator.userAgent.toLowerCase();
	
	if (agt.indexOf('firefox') >= 0) {
		browser = "Firefox";
		xmlURL = "bildverz.xml";
	} else if (agt.indexOf('msie') >=0) {
		browser = "MSIE";
		xmlURL = "bildverz.xml";
	} else if (agt.indexOf('safari') >=0) {
		browser = "Safari";
		xmlURL = "bildverz.xml";
	}
	alert(xmlURL);
	sys=(navigator.platform)?navigator.platform.toLowerCase():agt;

	os=((sys.indexOf('mac')>=0)?"Macintosh":(sys.indexOf('unix')>=0 || sys.indexOf('linux')>=0 || sys.indexOf('x11')>=0 || sys.indexOf('x 11')>=0)?"Linux/Unix":(sys.indexOf('os/2')>=0)?"OS/2":(sys.indexOf('win')>=0)?"Windows":"");

}



function infoFenster(URL1) {
	var breite = 600
	var hoehe = 500
	links=(screen.width-breite)/2 
	oben=(screen.height-hoehe)/4 
	F1=open(URL1,"","scrollbars=yes, resizable=yes, status=yes, width="+ breite+",height="+ hoehe+",top="+ oben+",screenY="+oben+",left="+ 	links+",screenX="+links)
}





function grossFenster(URL2) {
	var breite = screen.availWidth-10;
	var hoehe = screen.availHeight-10;
	links=0
	oben=0 
	F1=open(URL2,"","scrollbars=yes, resizable=yes, status=yes, width="+ breite+",height="+ hoehe+",top="+ oben+",screenY="+oben+",left="+ 	links+",screenX="+links)
	F1.resizeTo(screen.availWidth,screen.availHeight);
}





function transkriptionen(URL3) {
	var breite = screen.availWidth-10;
	var hoehe = screen.availHeight-10;
	links=0
	oben=0 
	F1=open(URL3,"","scrollbars=yes, resizable=yes, status=yes, width="+ breite+",height="+ hoehe+",top="+ oben+",screenY="+oben+",left="+ links+",screenX="+links)
	F1.resizeTo(screen.availWidth,screen.availHeight);
}



function initialenInfoFenster(URL4) {
	var breite = 500
	var hoehe = 500
	links=(screen.width-breite)/2 
	oben=(screen.height-hoehe)/4 
	F1=open(URL4,"","scrollbars=yes, resizable=yes, status=yes, width="+ breite+",height="+ hoehe+",top="+ oben+",screenY="+oben+",left="+ links+",screenX="+links)
}





function erlFenster(URL5) {
	var breite = 800
	var hoehe = 500
	links=(screen.width-breite)/2 
	oben=(screen.height-hoehe)/4 
	F1=open(URL5,"","scrollbars=yes, resizable=yes, status=yes, width="+ breite+",height="+ hoehe+",top="+ oben+",screenY="+oben+",left="+ 	links+",screenX="+links)
}



function doPrint() {
	//Nicht zu druckende Elemente ausblenden.
	for (i = 0; i < 5; i++) {
		if (document.images[i]){
			window.document.images[i].style.visibility = "hidden";
			//window.document.images[i].style.display = "none";
		}
	}

	document.form1.schliessen.style.visibility = "hidden";
	//Drucken
	window.print();

	//Nicht zu druckende Elemente wieder einblenden.
	setTimeout("iconsEinblenden()", 2000);
}



function iconsEinblenden() {

	for (i = 0; i < 5; i++) {

		if (document.images[i]){

			document.images[i].style.visibility = "visible";

		}

	}

	document.form1.schliessen.style.visibility = "visible";

}



function TasteGedrueckt(Ereignis) {

	if (navigator.appName == "Netscape") {

		if (parseInt(zoom) != 150) {

			if (Ereignis.which == 37) {

				goPrevPage();

			}

			if (Ereignis.which == 39) {

				goNextPage();

			}

		 	return true;

		}

	}

	if (navigator.appName == "Microsoft Internet Explorer") {

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

}

document.onkeydown = TasteGedrueckt;