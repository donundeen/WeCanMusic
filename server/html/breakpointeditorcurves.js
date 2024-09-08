const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const inputSlider = document.getElementById('inputSlider');
const inputValue = document.getElementById('inputValue');
const outputSlider = document.getElementById('outputSlider');
const outputValue = document.getElementById('outputValue');
const convertToArrayButton = document.getElementById('convertToArray');
const arrayOutput = document.getElementById('arrayOutput');
const arrayInput = document.getElementById('arrayInput');
const loadArrayButton = document.getElementById('loadArray');

let breakpoints = [];
let selectedPoint = null;
let controlPoints = [];
let isCtrlPressed = false;

// Utility function to draw the function
function drawFunction() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (breakpoints.length < 2) return; // Need at least two points to draw

    ctx.beginPath();
    ctx.moveTo(breakpoints[0].x, canvas.height - breakpoints[0].y);

    for (let i = 0; i < breakpoints.length - 1; i++) {
        const p1 = breakpoints[i];
        const p2 = breakpoints[i + 1];
        const c1 = controlPoints[i * 2] || { x: p1.x, y: p1.y };
        const c2 = controlPoints[i * 2 + 1] || { x: p2.x, y: p2.y };

        ctx.bezierCurveTo(c1.x, canvas.height - c1.y, c2.x, canvas.height - c2.y, p2.x, canvas.height - p2.y);
    }

    ctx.stroke();
}

// Utility function to draw breakpoints and control points
function drawBreakpoints() {
    breakpoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, canvas.height - point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.stroke();
    });

    controlPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, canvas.height - point.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.stroke();
    });
}

// Map input value (0.0 - 1.0) to output value based on the curve
function mapToCurve(input) {
    const x = input * canvas.width;
    const y = findYForX(x);
    if (y === null) return false;
    return 1 - (y / canvas.height); // Invert Y value to match the coordinate system
}

// Find Y value for a given X based on breakpoints and control points
function findYForX(x) {
    if (breakpoints.length < 2) return null;

    for (let i = 0; i < breakpoints.length - 1; i++) {
        const p1 = breakpoints[i];
        const p2 = breakpoints[i + 1];
        const c1 = controlPoints[i * 2] || { x: p1.x, y: p1.y };
        const c2 = controlPoints[i * 2 + 1] || { x: p2.x, y: p2.y };

        if (x >= p1.x && x <= p2.x) {
            return cubicBezierY(x, p1, c1, c2, p2);
        }
    }

    return null;
}

// Cubic Bézier interpolation for Y value
function cubicBezierY(x, p0, p1, p2, p3) {
    const t = (x - p0.x) / (p3.x - p0.x);
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const xCoord = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const yCoord = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

    return yCoord;
}

// Add or remove a breakpoint when clicking on the canvas
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = canvas.height - (event.clientY - rect.top); // Invert Y coordinate

    if (isCtrlPressed) {
        // 'c' key pressed: Create or adjust control points for curves
        if (selectedPoint) {
            const index = breakpoints.indexOf(selectedPoint);
            if (index > 0) {
                controlPoints[index * 2] = { x, y };
            }
            if (index < breakpoints.length - 1) {
                controlPoints[index * 2 + 1] = { x, y };
            }
            drawFunction();
            drawBreakpoints();
        }
    } else {
        // Normal click: Add a new breakpoint
        if (breakpoints.every(p => Math.hypot(p.x - x, p.y - y) > 10)) {
            breakpoints.push({ x, y });
            breakpoints.sort((a, b) => a.x - b.x); // Ensure breakpoints are sorted by X
            controlPoints = [];
            drawFunction();
            drawBreakpoints();
        }
    }
});

// Handle dragging breakpoints and control points
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = canvas.height - (event.clientY - rect.top); // Invert Y coordinate

    // Check if clicking on a breakpoint
    selectedPoint = breakpoints.find(point => Math.abs(point.x - x) < 10 && Math.abs(point.y - y) < 10);

    // Check if clicking on a control point
    if (!selectedPoint) {
        selectedPoint = controlPoints.find(point => Math.abs(point.x - x) < 10 && Math.abs(point.y - y) < 10);
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (selectedPoint) {
        const rect = canvas.getBoundingClientRect();
        selectedPoint.x = event.clientX - rect.left;
        selectedPoint.y = canvas.height - (event.clientY - rect.top); // Invert Y coordinate

        // Update control points if dragging a breakpoint
        if (breakpoints.includes(selectedPoint) && isCtrlPressed) {
            const index = breakpoints.indexOf(selectedPoint);
            if (index > 0) {
                controlPoints[index * 2] = { x: breakpoints[index].x, y: breakpoints[index].y };
            }
            if (index < breakpoints.length - 1) {
                controlPoints[index * 2 + 1] = { x: breakpoints[index + 1].x, y: breakpoints[index + 1].y };
            }
        }

        // Update the curve
        drawFunction();
        drawBreakpoints();
    }
});

canvas.addEventListener('mouseup', () => {
    selectedPoint = null;
});

// Handle key presses
document.addEventListener('keydown', (event) => {
    if (event.key === 'c') {
        console.log("c");
        isCtrlPressed = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'c') {
        isCtrlPressed = false;
    }
});

// Update sliders and map input to curve
inputSlider.addEventListener('input', () => {
    const input = inputSlider.value / 100; // Convert to range 0.0 - 1.0
    inputValue.textContent = input.toFixed(2);
    const output = mapToCurve(input);
    if (output === false) {
        outputSlider.value = 0;
        outputValue.textContent = 'undefined';
    } else {
        outputSlider.value = output * 100;
        outputValue.textContent = output.toFixed(2);
    }
});

// Convert the current curve to an array of breakpoints and control points
function curveToArray() {
    const breakpointsArray = breakpoints.map(point => [
        (point.x / canvas.width).toFixed(2),
        (1 - point.y / canvas.height).toFixed(2)
    ]);
    const controlPointsArray = controlPoints.map(point => [
        (point.x / canvas.width).toFixed(2),
        (1 - point.y / canvas.height).toFixed(2)
    ]);
    return { breakpoints: breakpointsArray, controlPoints: controlPointsArray };
}

// Load a curve from an array of breakpoints and control points
function arrayToCurve(array) {
    breakpoints = array.breakpoints.map(([x, y]) => ({
        x: parseFloat(x) * canvas.width,
        y: (1 - parseFloat(y)) * canvas.height
    }));
    controlPoints = array.controlPoints.map(([x, y]) => ({
        x: parseFloat(x) * canvas.width,
        y: (1 - parseFloat(y)) * canvas.height
    }));
    breakpoints.sort((a, b) => a.x - b.x); // Ensure breakpoints are sorted by X
    drawFunction();
    drawBreakpoints();
}

// Event handler for the "Convert Curve to Array" button
convertToArrayButton.addEventListener('click', () => {
    const array = curveToArray();
    arrayOutput.textContent = JSON.stringify(array);
});

// Event handler for the "Load Array" button
loadArrayButton.addEventListener('click', () => {
    try {
        const arrayStr = arrayInput.value.trim();
        const array = JSON.parse(arrayStr);
        if (array.breakpoints && array.controlPoints) {
            arrayToCurve(array);
        } else {
            alert('Invalid array format');
        }
    } catch (e) {
        alert('Invalid JSON format');
    }
});

// Initial drawing
drawFunction();
drawBreakpoints();
