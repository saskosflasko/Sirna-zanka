// PRIDOBI ELEMENTE
let resitev = document.getElementById("resitev");
let miska   = document.getElementById("miska");
let svg     = document.getElementById("lab");

// SPREMENLJIVKE ZA NADZOR IGRE
let offset       = 0;
let totalLength  = resitev.getTotalLength();
let moving       = false;
let rocnoIgranje = false; // Stanje ročnega igranja

/**
 * Posodobi položaj miške glede na offset po rdeči črti (samo pri animirani rešitvi).
 */
function updateMousePosition(offset) {
    let point = resitev.getPointAtLength(offset);
    let CTM   = svg.getScreenCTM();

    let svgPoint = svg.createSVGPoint();
    svgPoint.x = point.x;
    svgPoint.y = point.y;

    let screenPoint   = svgPoint.matrixTransform(CTM);
    let containerRect = svg.parentNode.getBoundingClientRect();

    let relativeX = screenPoint.x - containerRect.left;
    let relativeY = screenPoint.y - containerRect.top;

    miska.style.left = `${relativeX}px`;
    miska.style.top  = `${relativeY}px`;
}

/**
 * Funkcija za animirano izrisovanje rešitve (rdeča črta) + premikanje miške po poti.
 */
function narisi() {
    rocnoIgranje = false;
    resitev.setAttribute("stroke", "red");
    resitev.style.strokeDasharray  = totalLength;
    resitev.style.strokeDashoffset = totalLength;

    miska.style.display = "block";
    offset = 0;
    updateMousePosition(offset);

    function animiraj() {
        offset += 0.5;
        resitev.style.strokeDashoffset = totalLength - offset;
        updateMousePosition(offset);

        if (offset < totalLength) {
            requestAnimationFrame(animiraj);
        } else {
            Swal.fire({
                title: "Čestitke!",
                text: "Uspešno si dokončal labirint!",
                icon: "success",
                confirmButtonText: "Super!"
            });
        }
    }
    animiraj();
}

/**
 * RESETIRAJ – zdaj samo reloada stran (po želji).
 */
function resetiraj() {
    window.location.reload();
}

/**
 * Omogoči ROČNO igranje – miška se premika prosto z WASD
 * (NE sledi več rdeči črti). Postavimo jo na (234,2).
 */
function igrajRocno() {
    rocnoIgranje = true;
    resitev.setAttribute("stroke", "none");
    miska.style.display = "block";

    let vhodX = 234;
    let vhodY = 2;

    let CTM = svg.getScreenCTM();
    let svgPoint = svg.createSVGPoint();
    svgPoint.x = vhodX;
    svgPoint.y = vhodY;

    let screenPoint   = svgPoint.matrixTransform(CTM);
    let containerRect = svg.parentNode.getBoundingClientRect();

    let relativeX = screenPoint.x - containerRect.left;
    let relativeY = screenPoint.y - containerRect.top;

    miska.style.left = relativeX + "px";
    miska.style.top  = relativeY + "px";
}

/**
 * Pomožna funkcija: izračun razdalje med točko (px, py) in odsekom (x1, y1) -> (x2, y2).
 */
function pointLineDistance(px, py, x1, y1, x2, y2) {
    let A = px - x1;
    let B = py - y1;
    let C = x2 - x1;
    let D = y2 - y1;

    let dot = A*C + B*D;
    let len_sq = C*C + D*D;
    let param = (len_sq !== 0) ? (dot / len_sq) : -1;
    
    let xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    let dx = px - xx;
    let dy = py - yy;
    return Math.sqrt(dx*dx + dy*dy);
}

/**
 * Funkcija, ki preveri trk miške (newLeft, newTop) z zidom in
 * preprečuje izhod izven '2..482' na X in Y.
 */
function preveriTrk(newLeft, newTop) {
    // 1) Izračun točke v SVG koordinatah
    let containerRect = svg.parentNode.getBoundingClientRect();
    let CTM = svg.getScreenCTM().inverse();
    let screenPoint = svg.createSVGPoint();
    screenPoint.x = containerRect.left + newLeft;
    screenPoint.y = containerRect.top  + newTop;
    let svgP = screenPoint.matrixTransform(CTM); // Koord. miške v SVG

    // NOVO: Preverimo, ali miška gre izven '2..482' (navidezne meje labirinta).
    if (svgP.x < 2 || svgP.x > 482 || svgP.y < 2 || svgP.y > 482) {
        return true; // Trk – ne dovoli ven.
    }

    // 2) Preverimo vsako <line> (zid)
    let lines = svg.querySelectorAll("g > line");
    let hitboxRadius = 2; // Polmer trka, prilagodi po želji

    for (let line of lines) {
        let x1 = parseFloat(line.getAttribute("x1"));
        let y1 = parseFloat(line.getAttribute("y1"));
        let x2 = parseFloat(line.getAttribute("x2"));
        let y2 = parseFloat(line.getAttribute("y2"));

        let dist = pointLineDistance(svgP.x, svgP.y, x1, y1, x2, y2);
        if (dist < hitboxRadius) {
            return true;
        }
    }
    return false;
}

/**
 * Keydown – WASD ročno igranje z upoštevanjem trkov.
 */
document.addEventListener("keydown", function (event) {
    if (!rocnoIgranje || moving) return;
    moving = true;

    let step = 5;
    let currentLeft = parseInt(miska.style.left, 10) || 0;
    let currentTop  = parseInt(miska.style.top, 10)  || 0;

    let newLeft = currentLeft;
    let newTop  = currentTop;

    switch (event.key.toLowerCase()) {
        case 'w':
            newTop -= step;  
            break;
        case 's':
            newTop += step;  
            break;
        case 'a':
            newLeft -= step; 
            break;
        case 'd':
            newLeft += step; 
            break;
        default:
            moving = false;
            return;
    }

    if (preveriTrk(newLeft, newTop)) {
        console.log("Trk s steno ali izhod iz labirinta! Premik onemogočen.");
    } else {
        miska.style.left = newLeft + "px";
        miska.style.top  = newTop + "px";
    }

    setTimeout(() => { moving = false; }, 50);
});

/**
 * Prikaz vizitke (SweetAlert2)
 */
function prikaziVizitko() {
    Swal.fire({
        title: "Podatki!",
        html: `
            <p><strong>Ime:</strong> Sašo Simčič 4.RB</p>
            <p><strong>Projekt:</strong> Sirna zanka</p>
        `,
        icon: "info",
        confirmButtonText: "Zapri"
    });
}
// Funkcija za prikaz navodil v SweetAlert
function prikaziNavodila() {
    Swal.fire({
        title: "Navodila za igro",
        html: `
            <p><strong>Kako igrati:</strong></p>
            <p>Uporabite tipke <strong>W</strong>, <strong>A</strong>, <strong>S</strong>, <strong>D</strong> za premikanje miške po labirintu.</p>
            <p>Vaša naloga je, da miško premaknete skozi labirint in dosežete izhod.</p>
            <p>Bodite previdni!</p>
            <p>Ko dosežete cilj, boste prejeli čestitke.</p>
        `,
        icon: "info",
        confirmButtonText: "Razumem"
    });
}

