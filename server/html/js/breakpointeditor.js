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

// Utility function to draw the function
function drawFunction() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (breakpoints.length < 2) return; // Need at least two points to draw a line

    ctx.beginPath();
    ctx.moveTo(breakpoints[0].x, canvas.height - breakpoints[0].y);

    for (let i = 1; i < breakpoints.length; i++) {
        ctx.lineTo(breakpoints[i].x, canvas.height - breakpoints[i].y);
    }

    ctx.stroke();
}

// Utility function to draw breakpoints
function drawBreakpoints() {
    breakpoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, canvas.height - point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.stroke();
    });
}

// Map input value (0.0 - 1.0) to output value based on the curve
function mapToCurve(input) {
    const x = input * canvas.width;
    const y = breakpoints.length ? findYForX(x) : null;
    if (y === null) return false;
    return 1 - (y / canvas.height); // Invert Y value to match the coordinate system
}

// Find Y value for a given X based on breakpoints
function findYForX(x) {
    if (breakpoints.length < 2) return null;

    // Find the segment containing x
    for (let i = 0; i < breakpoints.length - 1; i++) {
        const p1 = breakpoints[i];
        const p2 = breakpoints[i + 1];

        if (x >= p1.x && x <= p2.x) {
            // Linear interpolation
            const t = (x - p1.x) / (p2.x - p1.x);
            return p1.y + t * (p2.y - p1.y);
        }
    }

    return null; // X is out of range
}

// Add or remove a breakpoint when clicking on the canvas
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = canvas.height - (event.clientY - rect.top); // Invert Y coordinate

    if (event.shiftKey) {
        // Shift-click: Remove a breakpoint if near it
        const index = breakpoints.findIndex(point => Math.hypot(point.x - x, point.y - y) < 10);
        if (index !== -1) {
            breakpoints.splice(index, 1); // Remove the breakpoint
            drawFunction();
            drawBreakpoints();
        }
    } else {
        // Normal click: Add a new breakpoint
        if (breakpoints.every(p => Math.hypot(p.x - x, p.y - y) > 10)) {
            breakpoints.push({ x, y });
            breakpoints.sort((a, b) => a.x - b.x); // Ensure breakpoints are sorted by X
            drawFunction();
            drawBreakpoints();
        }
    }
});

// Handle dragging breakpoints
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = canvas.height - (event.clientY - rect.top); // Invert Y coordinate

    // Check if clicking on a breakpoint
    selectedPoint = breakpoints.find(point => Math.abs(point.x - x) < 10 && Math.abs(point.y - y) < 10);
});

canvas.addEventListener('mousemove', (event) => {
    if (selectedPoint) {
        const rect = canvas.getBoundingClientRect();
        selectedPoint.x = event.clientX - rect.left;
        selectedPoint.y = canvas.height - (event.clientY - rect.top); // Invert Y coordinate

        // Prevent breakpoints from overlapping
        breakpoints.sort((a, b) => a.x - b.x); // Sort by X after moving

        drawFunction();
        drawBreakpoints();
    }
});

canvas.addEventListener('mouseup', () => {
    selectedPoint = null;
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

// Convert the current curve to an array of breakpoints
function curveToArray() {
    return breakpoints.map(point => [
        (point.x / canvas.width).toFixed(2),
        (1 - point.y / canvas.height).toFixed(2)
    ]);
}

// Load a curve from an array of breakpoints
function arrayToCurve(array) {
    breakpoints = array.map(([x, y]) => ({
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
        if (Array.isArray(array) && array.every(item => Array.isArray(item) && item.length === 2)) {
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
