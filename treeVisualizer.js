// Tree Visualization Core Variables
let treeGenerator = null;
let treeRunning = false;
let treeSpeed = 1000;
let treeNodes = {}; // Store all nodes by ID
let rootNodeId = null;
let treeAnimationFrame = null;
let treeFinalResult = null;
let nodeSize = { width: 120, height: 60 }; // Default node size

// Canvas and dimensions
let treeCanvas;
let treeCtx;
let canvasWidth = 800;
let canvasHeight = 600;

// Tree layout variables
let levelHeight = 100;
let horizontalSpacing = 40;
let nodePadding = 15;

// Node appearance
const colors = {
  call: "#3498db",
  executing: "#f39c12",
  return: "#2ecc71"
};

// Initialize the tree visualizer
function initTreeVisualizer() {
  treeCanvas = document.getElementById("treeCanvas");
  treeCtx = treeCanvas.getContext("2d");
  
  // Resize canvas to fit container
  resizeTreeCanvas();
  
  // Add resize listener
  window.addEventListener('resize', resizeTreeCanvas);
}

function resizeTreeCanvas() {
  if (!treeCanvas) return;
  
  const container = treeCanvas.parentElement;
  canvasWidth = container.clientWidth * 0.95;
  canvasHeight = Math.max(500, window.innerHeight * 0.6);
  
  treeCanvas.width = canvasWidth;
  treeCanvas.height = canvasHeight;
  
  // Redraw the tree with new dimensions if it exists
  if (rootNodeId && Object.keys(treeNodes).length > 0) {
    calculateTreeLayout();
    drawTree();
  }
}

function startTreeSimulation() {
  const n = parseInt(document.getElementById("inputValue").value);
  if (isNaN(n) || n < 0) {
    showAlert("Please enter a valid non-negative number.");
    return;
  }
  
  if (!treeGenerator) {
    console.log("Creating new tree generator");
    resetTreeVisualization();
    treeGenerator = createTreeGenerator();
    
    // Start performance tracking
    startTime = performance.now();
    callCount = 0;
  }
  
  treeRunning = true;
  toggleTreeButtons();
  runTreeNext();
}

function pauseTreeSimulation() {
  console.log("Tree simulation paused");
  treeRunning = false;
  toggleTreeButtons();
  
  if (treeAnimationFrame) {
    cancelAnimationFrame(treeAnimationFrame);
    treeAnimationFrame = null;
  }
}

function stepTreeSimulation() {
  if (!treeGenerator) {
    const n = parseInt(document.getElementById("inputValue").value);
    if (isNaN(n) || n < 0) {
      showAlert("Please enter a valid non-negative number.");
      return;
    }
    
    console.log("Creating new tree generator for step");
    resetTreeVisualization();
    treeGenerator = createTreeGenerator();
    
    // Start performance tracking
    startTime = performance.now();
    callCount = 0;
  }
  runTreeStep();
}

function resetTreeSimulation() {
  console.log("Tree simulation reset");
  treeRunning = false;
  
  if (treeAnimationFrame) {
    cancelAnimationFrame(treeAnimationFrame);
    treeAnimationFrame = null;
  }
  
  treeGenerator = null;
  resetTreeVisualization();
  toggleTreeButtons();
}

function resetTreeVisualization() {
  // Reset all visualization data
  treeNodes = {};
  rootNodeId = null;
  treeFinalResult = null;
  document.getElementById("finalResult").textContent = "-";
  
  // Clear tree canvas
  clearTreeCanvas();
}

function runTreeNext() {
  if (!treeRunning) return;
  
  try {
    const result = treeGenerator.next();
    console.log("Tree generator result:", result);
    
    if (result.done) {
      console.log("Tree generator finished with result:", result.value);
      treeFinalResult = result.value;
      document.getElementById("finalResult").textContent = treeFinalResult;
      treeRunning = false;
      toggleTreeButtons();
      return;
    }
    
    if (result.value) {
      updateTreeVisualization(result.value);
    }
    
    treeAnimationFrame = requestAnimationFrame(() => {
      setTimeout(runTreeNext, treeSpeed);
    });
  } catch (error) {
    console.error("Error in tree generator:", error);
    treeRunning = false;
    toggleTreeButtons();
    showAlert("An error occurred during execution: " + error.message);
  }
}

function runTreeStep() {
  try {
    const result = treeGenerator.next();
    console.log("Tree step result:", result);
    
    if (result.done) {
      console.log("Tree generator finished (step) with result:", result.value);
      treeFinalResult = result.value;
      document.getElementById("finalResult").textContent = treeFinalResult;
      treeRunning = false;
      toggleTreeButtons();
      return;
    }
    
    if (result.value) {
      updateTreeVisualization(result.value);
    }
  } catch (error) {
    console.error("Error in tree step:", error);
    treeRunning = false;
    toggleTreeButtons();
    showAlert("An error occurred during execution: " + error.message);
  }
}

function toggleTreeButtons() {
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stepBtn = document.getElementById("stepBtn");
  const resetBtn = document.getElementById("resetBtn");
  
  startBtn.disabled = treeRunning;
  pauseBtn.disabled = !treeRunning;
  stepBtn.disabled = treeRunning;
  resetBtn.disabled = false;
}

function createTreeGenerator() {
  const func = document.getElementById("functionSelect").value;
  const inputValue = document.getElementById("inputValue").value;
  
  try {
    if (func === "factorial") {
      const n = parseInt(inputValue);
      return factorial(n);
    } else if (func === "fibonacci") {
      const n = parseInt(inputValue);
      return fibonacci(n);
    } else if (func === "gcd") {
      const a = parseInt(inputValue);
      const b = parseInt(document.getElementById("inputValue2").value);
      return gcd(a, b);
    } else if (func === "power") {
      const base = parseInt(inputValue);
      const exponent = parseInt(document.getElementById("inputValue2").value);
      return power(base, exponent);
    } else if (func === "sumArray") {
      const arr = document.getElementById("inputArray").value.split(',').map(item => parseInt(item.trim()));
      return sumArray(arr);
    } else {
      console.error("Unknown function selected");
      return null;
    }
  } catch (error) {
    showAlert("Error creating generator: " + error.message);
    return null;
  }
}

function updateTreeVisualization(frame) {
  if (!frame) return;
  
  if (frame.type === "call") {
    const node = {
      id: frame.id,
      type: "call",
      func: frame.func,
      arg: frame.arg,
      parent: frame.parent,
      children: [],
      status: "executing",
      local: frame.local,
      value: null,
      x: 0,
      y: 0,
      width: nodeSize.width,
      height: nodeSize.height
    };
    
    treeNodes[frame.id] = node;
    
    if (frame.parent && treeNodes[frame.parent]) {
      treeNodes[frame.parent].children.push(frame.id);
    }
    
    if (!rootNodeId) {
      rootNodeId = frame.id;
    }
  } 
  else if (frame.type === "return") {
    if (treeNodes[frame.id]) {
      treeNodes[frame.id].value = frame.value;
      treeNodes[frame.id].status = "returned";
    }
  }
  
  calculateTreeLayout();
  drawTree();
}

function calculateTreeLayout() {
  if (!rootNodeId || Object.keys(treeNodes).length === 0) return;
  
  // Reset positions
  Object.values(treeNodes).forEach(node => {
    node.x = 0;
    node.y = 0;
  });
  
  // Calculate depth and assign y coordinates
  assignDepths(rootNodeId, 0);
  
  // Calculate horizontal positions
  calculateHorizontalPositions(rootNodeId);
  
  // Center the tree
  centerTree();
}

function assignDepths(nodeId, depth) {
  if (!treeNodes[nodeId]) return;
  
  const node = treeNodes[nodeId];
  node.y = depth * levelHeight + 50;
  
  for (const childId of node.children) {
    assignDepths(childId, depth + 1);
  }
}

function calculateHorizontalPositions(nodeId, x = 0) {
  if (!treeNodes[nodeId]) return x;
  
  const node = treeNodes[nodeId];
  
  if (node.children.length === 0) {
    node.x = x + nodeSize.width / 2;
    return x + nodeSize.width + horizontalSpacing;
  }
  
  let currentX = x;
  for (const childId of node.children) {
    currentX = calculateHorizontalPositions(childId, currentX);
  }
  
  const firstChild = treeNodes[node.children[0]];
  const lastChild = treeNodes[node.children[node.children.length - 1]];
  node.x = (firstChild.x + lastChild.x) / 2;
  
  return currentX;
}

function centerTree() {
  let minX = Infinity;
  let maxX = -Infinity;
  
  Object.values(treeNodes).forEach(node => {
    minX = Math.min(minX, node.x - node.width / 2);
    maxX = Math.max(maxX, node.x + node.width / 2);
  });
  
  const treeWidth = maxX - minX;
  const offset = (canvasWidth - treeWidth) / 2 - minX;
  
  Object.values(treeNodes).forEach(node => {
    node.x += offset;
  });
}

function clearTreeCanvas() {
  if (!treeCtx) return;
  treeCtx.clearRect(0, 0, canvasWidth, canvasHeight);
}

function drawTree() {
  if (!treeCtx || !rootNodeId) return;
  
  clearTreeCanvas();
  
  // Draw canvas background
  treeCtx.fillStyle = "#f9f9f9";
  treeCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Draw connections first
  drawConnections();
  
  // Draw all nodes
  for (const nodeId in treeNodes) {
    drawNode(treeNodes[nodeId]);
  }
}

function drawConnections() {
  treeCtx.strokeStyle = "#aaa";
  treeCtx.lineWidth = 2;
  
  for (const nodeId in treeNodes) {
    const node = treeNodes[nodeId];
    
    for (const childId of node.children) {
      const child = treeNodes[childId];
      if (!child) continue;
      
      treeCtx.beginPath();
      treeCtx.moveTo(node.x, node.y + node.height / 2);
      treeCtx.lineTo(child.x, child.y - child.height / 2);
      treeCtx.stroke();
    }
  }
}

function drawNode(node) {
  let fillColor;
  switch (node.status) {
    case "executing":
      fillColor = colors.executing;
      break;
    case "returned":
      fillColor = colors.return;
      break;
    default:
      fillColor = colors.call;
  }
  
  const x = node.x - node.width / 2;
  const y = node.y - node.height / 2;
  const radius = 8;
  
  // Draw shadow
  treeCtx.fillStyle = "rgba(0, 0, 0, 0.1)";
  treeCtx.fillRect(x + 3, y + 3, node.width, node.height);
  
  // Draw rounded rectangle
  treeCtx.fillStyle = fillColor;
  treeCtx.beginPath();
  treeCtx.moveTo(x + radius, y);
  treeCtx.lineTo(x + node.width - radius, y);
  treeCtx.quadraticCurveTo(x + node.width, y, x + node.width, y + radius);
  treeCtx.lineTo(x + node.width, y + node.height - radius);
  treeCtx.quadraticCurveTo(x + node.width, y + node.height, x + node.width - radius, y + node.height);
  treeCtx.lineTo(x + radius, y + node.height);
  treeCtx.quadraticCurveTo(x, y + node.height, x, y + node.height - radius);
  treeCtx.lineTo(x, y + radius);
  treeCtx.quadraticCurveTo(x, y, x + radius, y);
  treeCtx.closePath();
  treeCtx.fill();
  
  // Node border
  treeCtx.strokeStyle = "rgba(0, 0, 0, 0.3)";
  treeCtx.lineWidth = 1;
  treeCtx.stroke();
  
  // Draw text
  treeCtx.fillStyle = "white";
  treeCtx.font = "12px Arial";
  treeCtx.textAlign = "center";
  treeCtx.textBaseline = "middle";
  
  // Function name and arguments
  treeCtx.fillText(`${node.func}(${node.arg})`, node.x, node.y - 10);
  
  // Return value if available
  if (node.value !== null) {
    treeCtx.fillText(`Return: ${node.value}`, node.x, node.y + 10);
  }
}

// Initialize the tree visualizer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initTreeVisualizer();
});