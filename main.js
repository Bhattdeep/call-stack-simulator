// Function information and descriptions
const functionInfo = {
    factorial: {
        description: "Calculates the factorial of a number n (n!). The factorial is the product of all positive integers less than or equal to n.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)"
    },
    fibonacci: {
        description: "Calculates the nth number in the Fibonacci sequence, where each number is the sum of the two preceding ones.",
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n)"
    },
    gcd: {
        description: "Calculates the Greatest Common Divisor of two numbers using Euclidean algorithm.",
        timeComplexity: "O(log(min(a,b)))",
        spaceComplexity: "O(log(min(a,b)))"
    },
    power: {
        description: "Calculates x raised to the power n using recursive multiplication.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)"
    }
};

// Performance tracking
let startTime = 0;
let callCount = 0;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const functionSelect = document.getElementById('functionSelect');
    const inputValue = document.getElementById('inputValue');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepBtn = document.getElementById('stepBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedRange = document.getElementById('speedRange');
    const functionDescription = document.getElementById('functionDescription');
    const timeComplexity = document.getElementById('timeComplexity');
    const spaceComplexity = document.getElementById('spaceComplexity');
    const callCountElement = document.getElementById('callCount');
    const executionTime = document.getElementById('executionTime');

    // Initialize canvas and visualizers
    initializeVisualizers();

    // Event Listeners
    functionSelect.addEventListener('change', handleFunctionChange);
    startBtn.addEventListener('click', startVisualization);
    pauseBtn.addEventListener('click', pauseVisualization);
    stepBtn.addEventListener('click', stepVisualization);
    resetBtn.addEventListener('click', resetVisualization);
    speedRange.addEventListener('input', updateSpeed);
});

function initializeVisualizers() {
    // Initialize both tree and stack visualizers
    treeCanvas = document.getElementById('treeCanvas');
    treeCtx = treeCanvas.getContext('2d');
    
    // Set initial canvas dimensions
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Set initial function info
    updateFunctionInfo('factorial');
}

function resizeCanvas() {
    const container = document.querySelector('.visualization-container');
    if (container) {
        treeCanvas.width = container.offsetWidth;
        treeCanvas.height = container.offsetHeight;
        canvasWidth = treeCanvas.width;
        if (treeNodes && Object.keys(treeNodes).length > 0) {
            drawTree();
        }
    }
}

function handleFunctionChange(event) {
    const selectedFunction = event.target.value;
    updateFunctionInfo(selectedFunction);
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

function startVisualization() {
    if (!generator) {
        resetMetrics();
        startTime = performance.now();
        generator = createGenerator();
        treeGenerator = generator;
    }
    
    running = true;
    treeRunning = true;
    updateControlButtons();
    runNextStep();
}

function pauseVisualization() {
    running = false;
    treeRunning = false;
    updateControlButtons();
}

function stepVisualization() {
    if (!generator) {
        resetMetrics();
        startTime = performance.now();
        generator = createGenerator();
        treeGenerator = generator;
    }
    
    runSingleStep();
    updateControlButtons();
}

function resetVisualization() {
    running = false;
    treeRunning = false;
    generator = null;
    treeGenerator = null;
    treeNodes = {};
    stack = [];
    rootNodeId = null;
    resetMetrics();
    clearCanvas();
    updateControlButtons();
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
    document.getElementById('speedValue').textContent = `${speed}ms`;
}

function createGenerator() {
    const functionName = document.getElementById('functionSelect').value;
    const input = document.getElementById('inputValue').value;
    
    switch (functionName) {
        case 'factorial':
            return factorial(parseInt(input));
        case 'fibonacci':
            return fibonacci(parseInt(input));
        case 'gcd':
            const [a, b] = input.split(',').map(x => parseInt(x.trim()));
            return gcd(a, b);
        case 'power':
            const [base, exp] = input.split(',').map(x => parseInt(x.trim()));
            return power(base, exp);
        default:
            throw new Error('Unknown function selected');
    }
}

function updateTreeVisualization(frame) {
    if (!frame) return;
    
    if (frame.type === "call") {
        // Add node to tree
        treeNodes[frame.id] = {
            id: frame.id,
            func: frame.func,
            args: frame.arg,
            local: frame.local,
            children: [],
            parent: frame.parent
        };
        
        if (frame.parent && treeNodes[frame.parent]) {
            treeNodes[frame.parent].children.push(frame.id);
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
        stack.push(frame);
    } else if (frame.type === "return") {
        stack.pop();
    }
    
    drawStack();
}