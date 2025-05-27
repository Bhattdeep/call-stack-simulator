// Function information and descriptions
const functionInfo = {
  factorial: {
    description:
      "Calculates the factorial of a number n (n!). The factorial is the product of all positive integers less than or equal to n.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
  fibonacci: {
    description:
      "Calculates the nth number in the Fibonacci sequence, where each number is the sum of the two preceding ones.",
    timeComplexity: "O(2^n)",
    spaceComplexity: "O(n)",
  },
  gcd: {
    description:
      "Calculates the Greatest Common Divisor of two numbers using Euclidean algorithm.",
    timeComplexity: "O(log(min(a,b)))",
    spaceComplexity: "O(log(min(a,b)))",
  },
  power: {
    description: "Calculates x raised to the power n using recursive multiplication.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
};

// Performance tracking
let startTime = 0;
let callCount = 0;

// Visualization globals
let treeCanvas, treeCtx;
let treeNodes = {};
let rootNodeId = null;
let stack = [];
let generator = null;
let running = false;
let speed = 500; // default speed in ms

document.addEventListener("DOMContentLoaded", () => {
  const functionSelect = document.getElementById("functionSelect");
  const inputValue = document.getElementById("inputValue");
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stepBtn = document.getElementById("stepBtn");
  const resetBtn = document.getElementById("resetBtn");
  const speedRange = document.getElementById("speedRange");

  // Initialize canvas and visualizers
  initializeVisualizers();

  // Event Listeners
  functionSelect.addEventListener("change", handleFunctionChange);
  startBtn.addEventListener("click", startVisualization);
  pauseBtn.addEventListener("click", pauseVisualization);
  stepBtn.addEventListener("click", stepVisualization);
  resetBtn.addEventListener("click", resetVisualization);
  speedRange.addEventListener("input", updateSpeed);
});

function initializeVisualizers() {
  treeCanvas = document.getElementById("treeCanvas");
  treeCtx = treeCanvas.getContext("2d");

  // Set initial canvas dimensions
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Set initial function info
  updateFunctionInfo("factorial");
}

function resizeCanvas() {
  const container = document.querySelector(".visualization-container");
  if (container) {
    treeCanvas.width = container.offsetWidth;
    treeCanvas.height = container.offsetHeight;
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
    document.getElementById("functionDescription").textContent = info.description;
    document.getElementById("timeComplexity").textContent = info.timeComplexity;
    document.getElementById("spaceComplexity").textContent = info.spaceComplexity;
  }
}

function startVisualization() {
  if (!generator) {
    resetMetrics();
    startTime = performance.now();
    generator = createGenerator();
    if (!generator) return;
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
    if (!generator) return;
  }

  runSingleStep();
  updateControlButtons();
}

function resetVisualization() {
  running = false;
  generator = null;
  treeNodes = {};
  stack = [];
  rootNodeId = null;
  resetMetrics();
  clearCanvas();
  updateControlButtons();
}

function resetMetrics() {
  callCount = 0;
  document.getElementById("callCount").textContent = "0";
  document.getElementById("executionTime").textContent = "0.00 ms";
}

function updateControlButtons() {
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stepBtn = document.getElementById("stepBtn");

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
      document.getElementById("executionTime").textContent = `${(endTime - startTime).toFixed(2)} ms`;
      running = false;
      updateControlButtons();
      return false;
    }

    if (result.value) {
      callCount++;
      document.getElementById("callCount").textContent = callCount;
      updateTreeVisualization(result.value);
      updateStackVisualization(result.value);
    }
    return true;
  } catch (error) {
    console.error("Error during visualization:", error);
    running = false;
    updateControlButtons();
    return false;
  }
}

function updateSpeed(event) {
  speed = parseInt(event.target.value);
  document.getElementById("speedValue").textContent = `${speed} ms`;
}

function createGenerator() {
  const functionName = document.getElementById("functionSelect").value;
  const input = document.getElementById("inputValue").value;

  try {
    switch (functionName) {
      case "factorial":
        return factorial(parseInt(input));
      case "fibonacci":
        return fibonacci(parseInt(input));
      case "gcd":
        const [a, b] = input.split(",").map((x) => parseInt(x.trim()));
        return gcd(a, b);
      case "power":
        const [base, exp] = input.split(",").map((x) => parseInt(x.trim()));
        return power(base, exp);
      default:
        throw new Error("Unknown function selected");
    }
  } catch {
    alert("Please enter valid inputs (e.g. 5 or 12,3).");
    return null;
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
      parent: frame.parent,
      status: "running",
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

function clearCanvas() {
  if (treeCtx && treeCanvas) {
    treeCtx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);
  }
}

function drawTree() {
  if (!treeCtx || !treeCanvas) return;

  treeCtx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);

  if (!rootNodeId || !treeNodes[rootNodeId]) return;

  const nodeRadius = 25;

  // Recursive function to draw nodes and edges
  function drawNode(nodeId, x, y) {
    const node = treeNodes[nodeId];
    if (!node) return;

    // Draw lines to children first
    if (node.children && node.children.length > 0) {
      const spacing = 120;
      const childY = y + 90;
      const totalWidth = (node.children.length - 1) * spacing;

      node.children.forEach((childId, i) => {
        const childX = x - totalWidth / 2 + i * spacing;

        // Draw line from this node to child node
        treeCtx.beginPath();
        treeCtx.moveTo(x, y + nodeRadius);
        treeCtx.lineTo(childX, childY - nodeRadius);
        treeCtx.strokeStyle = "#555";
        treeCtx.lineWidth = 1.5;
        treeCtx.stroke();

        // Recursive draw child
        drawNode(childId, childX, childY);
      });
    }

    // Draw node circle
    treeCtx.beginPath();
    treeCtx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
    treeCtx.fillStyle = node.status === "completed" ? "#90ee90" : "#add8e6";
    treeCtx.fill();
    treeCtx.strokeStyle = "#000";
    treeCtx.lineWidth = 1.5;
    treeCtx.stroke();

    // Draw function name and args inside the node
    treeCtx.fillStyle = "#000";
    treeCtx.font = "14px Arial";
    treeCtx.textAlign = "center";
    treeCtx.fillText(`${node.func}(${node.args})`, x, y + 5);

    // Draw return value below if completed
    if (node.status === "completed" && node.returnValue !== undefined) {
      treeCtx.fillStyle = "#007700";
      treeCtx.font = "12px Arial";
      treeCtx.fillText(`= ${node.returnValue}`, x, y + 25);
    }
  }

  // Start drawing from root node centered horizontally, y=60
  drawNode(rootNodeId, treeCanvas.width / 2, 60);
}

function drawStack() {
  // Optional: Implement stack visualization here
  // For now, do nothing or you can add stack display in an HTML element
}
