let resitev = document.getElementById("resitev");
let miska = document.getElementById("miska");
let svg = document.getElementById("lab");

let offset = 0;
let totalLength = resitev.getTotalLength();

/**
 * Posodobi položaj miške glede na offset po rdeči črti (samo pri animirani rešitvi).
 */
function updateMousePosition(offset) {
    let point = resitev.getPointAtLength(offset);
    let CTM = svg.getScreenCTM();

    let svgPoint = svg.createSVGPoint();
    svgPoint.x = point.x;
    svgPoint.y = point.y;

    let screenPoint = svgPoint.matrixTransform(CTM);
    let containerRect = svg.parentNode.getBoundingClientRect();

    miska.style.left = `${screenPoint.x - containerRect.left - 8}px`;
    miska.style.top  = `${screenPoint.y - containerRect.top - 8}px`;
}

/**
 * Funkcija za animirano izrisovanje rešitve (rdeča črta) + premikanje miške po poti.
 */
function narisi() {
    resitev.setAttribute("stroke", "red");
    resitev.setAttribute("stroke-width", "4");
    resitev.style.strokeDasharray = totalLength;
    resitev.style.strokeDashoffset = totalLength;

    miska.style.display = "block";
    offset = 0;
    updateMousePosition(offset);

    function animiraj() {
        offset += 2;
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

function resetiraj() {
    window.location.reload();
}

function preveriTrk(newLeft, newTop) {
    const miskaRect = miska.getBoundingClientRect();

    const mouseCenterX = miskaRect.left + miskaRect.width / 2;
    const mouseCenterY = miskaRect.top + miskaRect.height / 2;

    const svgPoint = svg.createSVGPoint();
    svgPoint.x = mouseCenterX;
    svgPoint.y = mouseCenterY;

    const CTM = svg.getScreenCTM();
    if (!CTM) return false;

    const svgCoords = svgPoint.matrixTransform(CTM.inverse());

    const dot = document.getElementById("debug-dot") || document.createElement("div");
    if (!dot.id) {
        dot.id = "debug-dot";
        dot.style.position = "absolute";
        dot.style.width = "6px";
        dot.style.height = "6px";
        dot.style.background = "red";
        dot.style.borderRadius = "50%";
        dot.style.zIndex = 9999;
        document.body.appendChild(dot);
    }
    dot.style.left = mouseCenterX + "px";
    dot.style.top = mouseCenterY + "px";

    if (svgCoords.x < 2 || svgCoords.x > 482 || svgCoords.y < 2 || svgCoords.y > 482) {
        return true;
    }

    const hitboxRadius = 7;
    const lines = svg.querySelectorAll("line, g line");

    for (let line of lines) {
        const x1 = parseFloat(line.getAttribute("x1"));
        const y1 = parseFloat(line.getAttribute("y1"));
        const x2 = parseFloat(line.getAttribute("x2"));
        const y2 = parseFloat(line.getAttribute("y2"));

        const dist = pointLineDistance(svgCoords.x, svgCoords.y, x1, y1, x2, y2);
        if (dist < hitboxRadius) {
            if (dist < 2.5) continue;
            return true;
        }
    }

    return false;
}

function pointLineDistance(px, py, x1, y1, x2, y2) {
    let A = px - x1;
    let B = py - y1;
    let C = x2 - x1;
    let D = y2 - y1;

    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
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
    return Math.sqrt(dx * dx + dy * dy);
}

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

function prikaziNavodila() {
    Swal.fire({
        title: "Navodila za igro",
        html: `
            <p><strong>Kako igrati:</strong></p>
            <p>Klikni “Start” za samodejno animacijo miške skozi labirint.</p>
            <p>Če naleti na oviro, se ustavi.</p>
            <p>Ko pride do konca, dobiš čestitko!</p>
        `,
        icon: "info",
        confirmButtonText: "Razumem"
    });
}
