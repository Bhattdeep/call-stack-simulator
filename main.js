// Function information and descriptions
const functionInfo = {
    factorial: {
        description: "Calculates the factorial of a number n (n!). The factorial is the product of all positive integers less than or equal to n.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        inputs: { type: 'single', label1: 'n:', max: 12 }
    },
    fibonacci: {
        description: "Calculates the nth number in the Fibonacci sequence, where each number is the sum of the two preceding ones.",
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n)",
        inputs: { type: 'single', label1: 'n:', max: 15 }
    },
    gcd: {
        description: "Calculates the Greatest Common Divisor of two numbers using Euclidean algorithm.",
        timeComplexity: "O(log(min(a,b)))",
        spaceComplexity: "O(log(min(a,b)))",
        inputs: { type: 'double', label1: 'a:', label2: 'b:', max: 100 }
    },
    power: {
        description: "Calculates x raised to the power n using recursive multiplication.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        inputs: { type: 'double', label1: 'Base:', label2: 'Exponent:', max: 10 }
    },
    sumArray: {
        description: "Recursively calculates the sum of all elements in an array.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        inputs: { type: 'array', label1: 'Array elements:', max: 100 }
    }
};

// Performance tracking
let startTime = 0;
let callCount = 0;

// Visualization globals
let treeCanvas, treeCtx;
let stackCanvas, stackCtx;
let treeNodes = {};
let rootNodeId = null;
let pendingParentMap = {};
let stack = [];
let generator = null;
let running = false;
let speed = 500; // default speed in ms

// Tree panning and scrolling
let treeOffsetX = 0;
let treeOffsetY = 0;
let treeScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let lastTouchDistance = 0;

// DOM Elements - will be initialized later

document.addEventListener('DOMContentLoaded', () => {
    const functionSelect = document.getElementById('functionSelect');
    const inputValue = document.getElementById('inputValue');
    const inputValue2 = document.getElementById('inputValue2');
    const inputArray = document.getElementById('inputArray');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepBtn = document.getElementById('stepBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedRange = document.getElementById('speedRange');
    const stackRadio = document.getElementById('stackVisual');
    const treeRadio = document.getElementById('treeVisual');

    // Initialize canvas and visualizers
    initializeVisualizers();
    applyFunctionInputs(functionSelect.value);
    applyVisualType();

    // Event Listeners
    functionSelect.addEventListener('change', handleFunctionChange);
    stackRadio.addEventListener('change', applyVisualType);
    treeRadio.addEventListener('change', applyVisualType);
    startBtn.addEventListener('click', startVisualization);
    pauseBtn.addEventListener('click', pauseVisualization);
    stepBtn.addEventListener('click', stepVisualization);
    resetBtn.addEventListener('click', resetVisualization);
    speedRange.addEventListener('input', updateSpeed);
    
    // Tree reset view button
    const resetViewBtn = document.getElementById('resetViewBtn');
    if (resetViewBtn) {
        resetViewBtn.addEventListener('click', resetTreeView);
    }
});

function initializeVisualizers() {
    treeCanvas = document.getElementById('treeCanvas');
    treeCtx = treeCanvas.getContext('2d');

    stackCanvas = document.getElementById('stackCanvas');
    stackCtx = stackCanvas.getContext('2d');

    // Set initial canvas dimensions
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Add tree interaction events
    setupTreeInteractions();

    // Set initial function info
    updateFunctionInfo('factorial');
}

function resizeCanvas() {
    const container = document.querySelector('.visualization-container');
    if (!container) return;

    const isStack = document.getElementById('stackVisual').checked;

    // Fill most of the container for the active view
    const width = container.offsetWidth - 40; // padding allowance
    const height = 500; // fixed sensible height; could be dynamic from CSS

    treeCanvas.width = width;
    treeCanvas.height = height;

    stackCanvas.width = width;
    stackCanvas.height = height;

    if (!isStack && treeNodes && Object.keys(treeNodes).length > 0) {
        drawTree();
    }
    if (isStack) {
        drawStack();
    }
}

function handleFunctionChange(event) {
    const selectedFunction = event.target.value;
    updateFunctionInfo(selectedFunction);
    applyFunctionInputs(selectedFunction);
    resetVisualization();
}

function updateFunctionInfo(functionName) {
    const info = functionInfo[functionName];
    if (info) {
        document.getElementById('functionDescription').textContent = info.description;
        document.getElementById('timeComplexity').textContent = info.timeComplexity;
        document.getElementById('spaceComplexity').textContent = info.spaceComplexity;
    }
}

function applyFunctionInputs(functionName) {
    const info = functionInfo[functionName];
    const inputGroup2 = document.getElementById('inputGroup2');
    const arrayInputGroup = document.getElementById('arrayInputGroup');
    const inputLabel = document.getElementById('inputLabel');
    const input2Label = document.getElementById('input2Label');
    const inputValue = document.getElementById('inputValue');
    const inputValue2 = document.getElementById('inputValue2');

    if (!info || !info.inputs) return;

    // Reset visibility
    inputGroup2.style.display = 'none';
    arrayInputGroup.style.display = 'none';

    if (info.inputs.type === 'single') {
        inputLabel.textContent = info.inputs.label1;
        inputValue.max = info.inputs.max || 10;
    } else if (info.inputs.type === 'double') {
        inputLabel.textContent = info.inputs.label1;
        input2Label.textContent = info.inputs.label2 || 'b:';
        inputGroup2.style.display = 'flex';
        inputValue.max = info.inputs.max || 10;
        inputValue2.max = info.inputs.max || 10;
    } else if (info.inputs.type === 'array') {
        inputLabel.textContent = info.inputs.label1;
        arrayInputGroup.style.display = 'flex';
    }
}

function applyVisualType() {
    const isStack = document.getElementById('stackVisual').checked;
    const stackView = document.getElementById('stackView');
    const treeView = document.getElementById('treeView');
    const treeControls = document.getElementById('treeControls');
    const title = document.getElementById('visualizationTitle');

    if (isStack) {
        stackView.style.display = 'block';
        treeView.style.display = 'none';
        treeControls.style.display = 'none';
        title.textContent = 'Stack Visualization';
    } else {
        stackView.style.display = 'none';
        treeView.style.display = 'block';
        treeControls.style.display = 'flex';
        title.textContent = 'Tree Visualization';
    }

    // Redraw with new sizes
    resizeCanvas();
}

function startVisualization() {
    if (!generator) {
        resetMetrics();
        startTime = performance.now();
        generator = createGenerator();
    }
    
    running = true;
    updateControlButtons();
    runNextStep();
}

function pauseVisualization() {
    running = false;
    updateControlButtons();
}

function stepVisualization() {
    if (!generator) {
        resetMetrics();
        startTime = performance.now();
        generator = createGenerator();
    }
    
    runSingleStep();
    updateControlButtons();
}

function resetVisualization() {
    running = false;
    generator = null;
    treeNodes = {};
    pendingParentMap = {};
    stack = [];
    rootNodeId = null;
    resetMetrics();
    clearCanvas();
    updateControlButtons();
    document.getElementById('finalResult').textContent = '-';
    resetTreeView();
}

function resetMetrics() {
    callCount = 0;
    document.getElementById('callCount').textContent = '0';
    document.getElementById('executionTime').textContent = '0.00 ms';
}

function updateControlButtons() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepBtn = document.getElementById('stepBtn');
    
    startBtn.disabled = running;
    pauseBtn.disabled = !running;
    stepBtn.disabled = running;
}

function runNextStep() {
    if (!running) return;
    
    const success = runSingleStep();
    if (success) {
        setTimeout(runNextStep, speed);
    }
}

function runSingleStep() {
    try {
        const result = generator.next();
        if (result.done) {
            const endTime = performance.now();
            document.getElementById('executionTime').textContent = 
                `${(endTime - startTime).toFixed(2)} ms`;
            document.getElementById('finalResult').textContent = result.value || '-';
            running = false;
            updateControlButtons();
            return false;
        }
        
        if (result.value) {
            callCount++;
            document.getElementById('callCount').textContent = callCount;
            updateTreeVisualization(result.value);
            updateStackVisualization(result.value);
        }
        return true;
    } catch (error) {
        console.error('Error during visualization:', error);
        running = false;
        updateControlButtons();
        return false;
    }
}

function updateSpeed(event) {
    speed = parseInt(event.target.value);
    document.getElementById('speedValue').textContent = `${speed} ms`;
}

function createGenerator() {
    const functionName = document.getElementById('functionSelect').value;
    const input = document.getElementById('inputValue').value;
    const input2 = document.getElementById('inputValue2').value;
    const inputArrStr = document.getElementById('inputArray').value;

    switch (functionName) {
        case 'factorial':
            return factorial(parseInt(input));
        case 'fibonacci':
            return fibonacci(parseInt(input));
        case 'gcd':
            return gcd(parseInt(input), parseInt(input2));
        case 'power':
            return power(parseInt(input), parseInt(input2));
        case 'sumArray': {
            const arr = inputArrStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            return sumArray(arr);
        }
        default:
            throw new Error('Unknown function selected');
    }
}

function updateTreeVisualization(frame) {
    if (!frame) return;

    if (frame.type === "call") {
        // If this frame announces a child to be called next, remember the parent mapping
        if (frame.childId) {
            pendingParentMap[frame.childId] = frame.id;
        }

        // Determine parent from explicit field or pending map
        const parentId = frame.parent || pendingParentMap[frame.id] || null;

        // Create or update node
        if (!treeNodes[frame.id]) {
            treeNodes[frame.id] = {
                id: frame.id,
                func: frame.func,
                args: frame.arg,
                local: frame.local,
                children: [],
                parent: parentId,
                status: "running"
            };
        } else {
            treeNodes[frame.id].status = "running";
            treeNodes[frame.id].parent = parentId;
        }

        // Link to parent if available
        if (parentId && treeNodes[parentId]) {
            if (!treeNodes[parentId].children.includes(frame.id)) {
                treeNodes[parentId].children.push(frame.id);
            }
        } else if (!rootNodeId) {
            rootNodeId = frame.id;
        }
    } else if (frame.type === "return") {
        if (treeNodes[frame.id]) {
            treeNodes[frame.id].returnValue = frame.value;
            treeNodes[frame.id].status = "completed";
        }
    }

    drawTree();
}

function updateStackVisualization(frame) {
    if (!frame) return;
    
    if (frame.type === "call") {
        stack.push({...frame}); // clone frame to avoid mutation issues
    } else if (frame.type === "return") {
        stack.pop();
    }
    
    drawStack();
}

function clearCanvas() {
    if (treeCtx && treeCanvas) {
        treeCtx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);
    }
    if (stackCtx && stackCanvas) {
        stackCtx.clearRect(0, 0, stackCanvas.width, stackCanvas.height);
    }
}

// === Drawing the Tree on treeCanvas ===
function drawTree() {
    if (!treeCtx || !treeCanvas) return;

    treeCtx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);

    // Draw background
    const gradient = treeCtx.createLinearGradient(0, 0, 0, treeCanvas.height);
    gradient.addColorStop(0, "#f8f9fa");
    gradient.addColorStop(1, "#e9ecef");
    treeCtx.fillStyle = gradient;
    treeCtx.fillRect(0, 0, treeCanvas.width, treeCanvas.height);

    if (!rootNodeId || !treeNodes[rootNodeId]) {
        // Draw empty state
        treeCtx.fillStyle = "#6c757d";
        treeCtx.font = "18px Arial";
        treeCtx.textAlign = "center";
        treeCtx.fillText("Click Start to visualize the recursive call tree", treeCanvas.width / 2, treeCanvas.height / 2);
        treeCtx.fillStyle = "#adb5bd";
        treeCtx.font = "14px Arial";
        treeCtx.fillText("Use mouse to pan and scroll to zoom", treeCanvas.width / 2, treeCanvas.height / 2 + 30);
        return;
    }

    // Save context and apply transformations
    treeCtx.save();
    treeCtx.translate(treeOffsetX, treeOffsetY);
    treeCtx.scale(treeScale, treeScale);

    // Calculate tree layout positions
    const layout = calculateTreeLayout(rootNodeId);
    
    // Draw connections first
    drawConnections(layout);
    
    // Draw nodes on top
    drawNodes(layout);
    
    // Restore context
    treeCtx.restore();
    
    // Draw UI overlay (zoom level, instructions)
    drawTreeOverlay();
}

function calculateTreeLayout(rootId) {
    const layout = {};
    const nodeWidth = 120;
    const nodeHeight = 50;
    const levelHeight = 80;
    const minSpacing = 20;

    // First pass: calculate subtree widths
    function calculateSubtreeWidth(nodeId) {
        const node = treeNodes[nodeId];
        if (!node || !node.children || node.children.length === 0) {
            return nodeWidth;
        }

        let totalChildWidth = 0;
        node.children.forEach(childId => {
            totalChildWidth += calculateSubtreeWidth(childId) + minSpacing;
        });
        totalChildWidth -= minSpacing; // Remove last spacing

        return Math.max(nodeWidth, totalChildWidth);
    }

    // Second pass: position nodes
    function positionNodes(nodeId, x, y, availableWidth) {
        const node = treeNodes[nodeId];
        if (!node) return;

        // Position this node
        layout[nodeId] = {
            x: x + availableWidth / 2,
            y: y + nodeHeight / 2,
            width: nodeWidth,
            height: nodeHeight,
            node: node
        };

        // Position children
        if (node.children && node.children.length > 0) {
            let currentX = x;
            node.children.forEach(childId => {
                const childWidth = calculateSubtreeWidth(childId);
                positionNodes(childId, currentX, y + levelHeight, childWidth);
                currentX += childWidth + minSpacing;
            });
        }
    }

    const totalWidth = calculateSubtreeWidth(rootId);
    const startX = Math.max(0, (treeCanvas.width - totalWidth) / 2);
    positionNodes(rootId, startX, 30, totalWidth);

    return layout;
}

function drawConnections(layout) {
    Object.values(layout).forEach(nodeLayout => {
        const node = nodeLayout.node;
        if (node.children && node.children.length > 0) {
            node.children.forEach(childId => {
                const childLayout = layout[childId];
                if (childLayout) {
                    // Draw curved connection
                    const startX = nodeLayout.x;
                    const startY = nodeLayout.y + nodeLayout.height / 2;
                    const endX = childLayout.x;
                    const endY = childLayout.y - childLayout.height / 2;
                    
                    const controlY = startY + (endY - startY) * 0.5;
                    
                    treeCtx.beginPath();
                    treeCtx.moveTo(startX, startY);
                    treeCtx.bezierCurveTo(
                        startX, controlY,
                        endX, controlY,
                        endX, endY
                    );
                    treeCtx.strokeStyle = '#495057';
                    treeCtx.lineWidth = 2;
                    treeCtx.stroke();
                    
                    // Draw arrow head
                    const arrowSize = 8;
                    const angle = Math.atan2(endY - controlY, endX - endX);
                    treeCtx.save();
                    treeCtx.translate(endX, endY);
                    treeCtx.rotate(angle + Math.PI / 2);
                    treeCtx.beginPath();
                    treeCtx.moveTo(0, 0);
                    treeCtx.lineTo(-arrowSize / 2, -arrowSize);
                    treeCtx.lineTo(arrowSize / 2, -arrowSize);
                    treeCtx.closePath();
                    treeCtx.fillStyle = '#495057';
                    treeCtx.fill();
                    treeCtx.restore();
                }
            });
        }
    });
}

function drawNodes(layout) {
    Object.values(layout).forEach(nodeLayout => {
        const node = nodeLayout.node;
        const x = nodeLayout.x - nodeLayout.width / 2;
        const y = nodeLayout.y - nodeLayout.height / 2;
        const width = nodeLayout.width;
        const height = nodeLayout.height;

        // Draw node shadow
        treeCtx.fillStyle = "rgba(0, 0, 0, 0.1)";
        treeCtx.fillRect(x + 3, y + 3, width, height);

        // Draw node background
        const isCompleted = node.status === "completed";
        const isRunning = node.status === "running";
        
        if (isCompleted) {
            treeCtx.fillStyle = "#28a745"; // Green
        } else if (isRunning) {
            treeCtx.fillStyle = "#007bff"; // Blue
        } else {
            treeCtx.fillStyle = "#6c757d"; // Gray
        }
        
        // Rounded rectangle
        const radius = 8;
        treeCtx.beginPath();
        treeCtx.moveTo(x + radius, y);
        treeCtx.lineTo(x + width - radius, y);
        treeCtx.quadraticCurveTo(x + width, y, x + width, y + radius);
        treeCtx.lineTo(x + width, y + height - radius);
        treeCtx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        treeCtx.lineTo(x + radius, y + height);
        treeCtx.quadraticCurveTo(x, y + height, x, y + height - radius);
        treeCtx.lineTo(x, y + radius);
        treeCtx.quadraticCurveTo(x, y, x + radius, y);
        treeCtx.closePath();
        treeCtx.fill();

        // Draw node border
        treeCtx.strokeStyle = "#ffffff";
        treeCtx.lineWidth = 2;
        treeCtx.stroke();

        // Draw function call text
        treeCtx.fillStyle = "#ffffff";
        treeCtx.font = "bold 12px Arial";
        treeCtx.textAlign = "center";
        treeCtx.textBaseline = "top";
        const funcText = `${node.func}(${node.args})`;
        treeCtx.fillText(funcText, nodeLayout.x, y + 8);

        // Draw return value if completed
        if (isCompleted && node.returnValue !== undefined) {
            treeCtx.font = "11px Arial";
            treeCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
            treeCtx.fillText(`→ ${node.returnValue}`, nodeLayout.x, y + 26);
        } else if (isRunning) {
            // Draw loading indicator
            treeCtx.font = "10px Arial";
            treeCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
            treeCtx.fillText("executing...", nodeLayout.x, y + 26);
        }

        // Draw status indicator
        const indicatorRadius = 6;
        const indicatorX = x + width - indicatorRadius - 5;
        const indicatorY = y + indicatorRadius + 5;
        
        treeCtx.beginPath();
        treeCtx.arc(indicatorX, indicatorY, indicatorRadius, 0, 2 * Math.PI);
        if (isCompleted) {
            treeCtx.fillStyle = "#ffffff";
            treeCtx.fill();
            treeCtx.strokeStyle = "#28a745";
            treeCtx.lineWidth = 2;
            treeCtx.stroke();
            
            // Draw checkmark
            treeCtx.strokeStyle = "#28a745";
            treeCtx.lineWidth = 2;
            treeCtx.beginPath();
            treeCtx.moveTo(indicatorX - 3, indicatorY);
            treeCtx.lineTo(indicatorX - 1, indicatorY + 2);
            treeCtx.lineTo(indicatorX + 3, indicatorY - 2);
            treeCtx.stroke();
        } else if (isRunning) {
            treeCtx.fillStyle = "#ffc107";
            treeCtx.fill();
            treeCtx.strokeStyle = "#ffffff";
            treeCtx.lineWidth = 1;
            treeCtx.stroke();
        }
    });
}

// === Drawing the Stack on stackCanvas ===
function drawStack() {
    if (!stackCtx || !stackCanvas) return;

    stackCtx.clearRect(0, 0, stackCanvas.width, stackCanvas.height);

    // Draw background
    stackCtx.fillStyle = "#f8f9fa";
    stackCtx.fillRect(0, 0, stackCanvas.width, stackCanvas.height);

    // Draw stack container border
    stackCtx.strokeStyle = "#dee2e6";
    stackCtx.lineWidth = 2;
    stackCtx.strokeRect(10, 10, stackCanvas.width - 20, stackCanvas.height - 20);

    // Draw stack label
    stackCtx.fillStyle = "#495057";
    stackCtx.font = "bold 16px Arial";
    stackCtx.textAlign = "left";
    stackCtx.fillText("Call Stack", 20, 35);

    if (stack.length === 0) {
        stackCtx.fillStyle = "#6c757d";
        stackCtx.font = "14px Arial";
        stackCtx.textAlign = "center";
        stackCtx.fillText("Stack is empty", stackCanvas.width / 2, stackCanvas.height / 2);
        return;
    }

    // Calculate frame dimensions
    const frameHeight = 60;
    const frameWidth = stackCanvas.width - 60;
    const startY = stackCanvas.height - 50;
    const margin = 30;

    // Draw stack frames from bottom to top
    stack.forEach((frame, index) => {
        const y = startY - (index * frameHeight) - (index * 5); // Small gap between frames
        const x = margin;

        // Skip if frame would be outside canvas
        if (y < 50) return;

        // Draw frame shadow
        stackCtx.fillStyle = "rgba(0, 0, 0, 0.1)";
        stackCtx.fillRect(x + 3, y + 3, frameWidth, frameHeight);

        // Draw frame background
        const isActive = index === stack.length - 1;
        stackCtx.fillStyle = isActive ? "#007bff" : "#28a745";
        stackCtx.fillRect(x, y, frameWidth, frameHeight);

        // Draw frame border
        stackCtx.strokeStyle = "#ffffff";
        stackCtx.lineWidth = 2;
        stackCtx.strokeRect(x, y, frameWidth, frameHeight);

        // Draw function call text
        stackCtx.fillStyle = "#ffffff";
        stackCtx.font = "bold 14px Arial";
        stackCtx.textAlign = "left";
        const funcText = `${frame.func}(${frame.arg})`;
        stackCtx.fillText(funcText, x + 10, y + 20);

        // Draw local variables if available
        if (frame.local && Object.keys(frame.local).length > 0) {
            stackCtx.font = "12px Arial";
            stackCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
            const localVars = Object.entries(frame.local)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ");
            stackCtx.fillText(`Local: ${localVars}`, x + 10, y + 40);
        }

        // Draw status indicator
        stackCtx.fillStyle = isActive ? "#ffc107" : "#ffffff";
        stackCtx.font = "10px Arial";
        stackCtx.textAlign = "right";
        const status = isActive ? "ACTIVE" : "WAITING";
        stackCtx.fillText(status, x + frameWidth - 10, y + 15);
    });

    // Draw stack pointer arrow for active frame
    if (stack.length > 0) {
        const activeIndex = stack.length - 1;
        const arrowY = startY - (activeIndex * frameHeight) - (activeIndex * 5) + frameHeight / 2;
        if (arrowY > 50) {
            stackCtx.fillStyle = "#dc3545";
            stackCtx.font = "20px Arial";
            stackCtx.textAlign = "left";
            stackCtx.fillText("►", 5, arrowY + 5);
        }
    }

    // Draw overflow indicator if needed
    const maxVisibleFrames = Math.floor((stackCanvas.height - 100) / (frameHeight + 5));
    if (stack.length > maxVisibleFrames) {
        stackCtx.fillStyle = "#dc3545";
        stackCtx.font = "12px Arial";
        stackCtx.textAlign = "center";
        stackCtx.fillText(`... and ${stack.length - maxVisibleFrames} more frames`, stackCanvas.width / 2, 60);
    }
}

// === Tree Interaction Functions ===
function setupTreeInteractions() {
    // Mouse events for panning
    treeCanvas.addEventListener('mousedown', handleTreeMouseDown);
    treeCanvas.addEventListener('mousemove', handleTreeMouseMove);
    treeCanvas.addEventListener('mouseup', handleTreeMouseUp);
    treeCanvas.addEventListener('mouseleave', handleTreeMouseUp);
    
    // Wheel event for zooming
    treeCanvas.addEventListener('wheel', handleTreeWheel);
    
    // Touch events for mobile
    treeCanvas.addEventListener('touchstart', handleTreeTouchStart);
    treeCanvas.addEventListener('touchmove', handleTreeTouchMove);
    treeCanvas.addEventListener('touchend', handleTreeTouchEnd);
    
    // Prevent context menu
    treeCanvas.addEventListener('contextmenu', e => e.preventDefault());
}

function handleTreeMouseDown(e) {
    const isTreeView = document.getElementById('treeVisual').checked;
    if (!isTreeView) return;
    
    isDragging = true;
    const rect = treeCanvas.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;
    treeCanvas.style.cursor = 'grabbing';
}

function handleTreeMouseMove(e) {
    const isTreeView = document.getElementById('treeVisual').checked;
    if (!isTreeView) return;
    
    if (isDragging) {
        const rect = treeCanvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        treeOffsetX += currentX - dragStartX;
        treeOffsetY += currentY - dragStartY;
        
        dragStartX = currentX;
        dragStartY = currentY;
        
        drawTree();
    } else {
        treeCanvas.style.cursor = 'grab';
    }
}

function handleTreeMouseUp(e) {
    isDragging = false;
    treeCanvas.style.cursor = 'grab';
}

function handleTreeWheel(e) {
    const isTreeView = document.getElementById('treeVisual').checked;
    if (!isTreeView) return;
    
    e.preventDefault();
    
    const rect = treeCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, treeScale * zoomFactor));
    
    // Adjust offset to zoom towards mouse position
    const scaleChange = newScale / treeScale;
    treeOffsetX = mouseX - (mouseX - treeOffsetX) * scaleChange;
    treeOffsetY = mouseY - (mouseY - treeOffsetY) * scaleChange;
    
    treeScale = newScale;
    drawTree();
}

// Touch events for mobile support
function handleTreeTouchStart(e) {
    const isTreeView = document.getElementById('treeVisual').checked;
    if (!isTreeView) return;
    
    e.preventDefault();
    
    if (e.touches.length === 1) {
        // Single touch - start dragging
        isDragging = true;
        const rect = treeCanvas.getBoundingClientRect();
        dragStartX = e.touches[0].clientX - rect.left;
        dragStartY = e.touches[0].clientY - rect.top;
    } else if (e.touches.length === 2) {
        // Two fingers - prepare for pinch zoom
        isDragging = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) + 
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }
}

function handleTreeTouchMove(e) {
    const isTreeView = document.getElementById('treeVisual').checked;
    if (!isTreeView) return;
    
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
        // Single touch - pan
        const rect = treeCanvas.getBoundingClientRect();
        const currentX = e.touches[0].clientX - rect.left;
        const currentY = e.touches[0].clientY - rect.top;
        
        treeOffsetX += currentX - dragStartX;
        treeOffsetY += currentY - dragStartY;
        
        dragStartX = currentX;
        dragStartY = currentY;
        
        drawTree();
    } else if (e.touches.length === 2) {
        // Two fingers - pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) + 
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        if (lastTouchDistance > 0) {
            const zoomFactor = currentDistance / lastTouchDistance;
            const newScale = Math.max(0.1, Math.min(3, treeScale * zoomFactor));
            
            // Center of pinch
            const rect = treeCanvas.getBoundingClientRect();
            const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
            const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
            
            // Adjust offset to zoom towards pinch center
            const scaleChange = newScale / treeScale;
            treeOffsetX = centerX - (centerX - treeOffsetX) * scaleChange;
            treeOffsetY = centerY - (centerY - treeOffsetY) * scaleChange;
            
            treeScale = newScale;
            drawTree();
        }
        
        lastTouchDistance = currentDistance;
    }
}

function handleTreeTouchEnd(e) {
    isDragging = false;
    lastTouchDistance = 0;
}

function resetTreeView() {
    treeOffsetX = 0;
    treeOffsetY = 0;
    treeScale = 1;
    drawTree();
}

function drawTreeOverlay() {
    // Draw zoom level indicator
    treeCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
    treeCtx.fillRect(10, 10, 120, 30);
    
    treeCtx.fillStyle = "#ffffff";
    treeCtx.font = "12px Arial";
    treeCtx.textAlign = "left";
    treeCtx.fillText(`Zoom: ${(treeScale * 100).toFixed(0)}%`, 15, 30);
    
    // Draw instructions in bottom right
    const instructions = [
        "Mouse: Drag to pan, scroll to zoom",
        "Touch: Drag to pan, pinch to zoom"
    ];
    
    treeCtx.fillStyle = "rgba(0, 0, 0, 0.6)";
    treeCtx.fillRect(treeCanvas.width - 250, treeCanvas.height - 50, 240, 40);
    
    treeCtx.fillStyle = "#ffffff";
    treeCtx.font = "11px Arial";
    instructions.forEach((text, i) => {
        treeCtx.fillText(text, treeCanvas.width - 245, treeCanvas.height - 35 + i * 15);
    });
}

// Generators are provided by functions.js. Removing local duplicates to avoid conflicts.
