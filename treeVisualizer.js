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
let levelHeight = 80;
let horizontalSpacing = 20;
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
  const n = parseInt(inputValue.value);
  if (isNaN(n) || n < 0) {
    showAlert("Please enter a valid non-negative number.");
    return;
  }
  
  const metadata = functionMetadata[currentFunction];
  let maxValue = metadata.maxValue;
  
  // Adjust warnings based on function
  if (currentFunction === "fibonacci" && n > 8) {
    showAlert(`Warning: Fibonacci with n > 8 creates a large tree visualization that might be difficult to display.`);
  }
  
  if (n > maxValue) {
    showAlert(`Warning: Values larger than ${maxValue} may cause performance issues. Using ${maxValue} instead.`);
    inputValue.value = maxValue;
  }

  if (!treeGenerator) {
    console.log("Creating new tree generator");
    resetTreeVisualization();
    treeGenerator = createGenerator();
    
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
    const n = parseInt(inputValue.value);
    if (isNaN(n) || n < 0) {
      showAlert("Please enter a valid non-negative number.");
      return;
    }
    
    const metadata = functionMetadata[currentFunction];
    let maxValue = metadata.maxValue;
    
    // Adjust warnings based on function
    if (currentFunction === "fibonacci" && n > 8) {
      showAlert(`Warning: Fibonacci with n > 8 creates a large tree visualization that might be difficult to display.`);
    }
    
    if (n > maxValue) {
      showAlert(`Warning: Values larger than ${maxValue} may cause performance issues. Using ${maxValue} instead.`);
      inputValue.value = maxValue;
    }
    
    console.log("Creating new tree generator for step");
    resetTreeVisualization();
    treeGenerator = createGenerator();
    
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
  
  // Reset performance tracking
  callCount = 0;
  callCountDisplay.textContent = "0";
  document.getElementById("executionTime").textContent = "0.00 ms";
}

function resetTreeVisualization() {
  // Reset all visualization data
  treeNodes = {};
  rootNodeId = null;
  treeFinalResult = null;
  finalResultDisplay.textContent = "-";
  
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
      finalResultDisplay.textContent = treeFinalResult;
      treeRunning = false;
      toggleTreeButtons();
      
      // Record end time and display execution time
      endTime = performance.now();
      const executionTime = (endTime - startTime).toFixed(2);
      document.getElementById("executionTime").textContent = `${executionTime} ms`;
      
      return;
    }
    
    if (result.value) {
      updateTreeVisualization(result.value);
      
      // Track call count
      if (result.value.type === "call") {
        callCount++;
        callCountDisplay.textContent = callCount;
      }
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
      finalResultDisplay.textContent = treeFinalResult;
      treeRunning = false;
      toggleTreeButtons();
      
      // Record end time and display execution time
      endTime = performance.now();
      const executionTime = (endTime - startTime).toFixed(2);
      document.getElementById("executionTime").textContent = `${executionTime} ms`;
      
      return;
    }
    
    if (result.value) {
      updateTreeVisualization(result.value);
      
      // Track call count
      if (result.value.type === "call") {
        callCount++;
        callCountDisplay.textContent = callCount;
      }
    }
  } catch (error) {
    console.error("Error in tree step:", error);
    treeRunning = false;
    toggleTreeButtons();
    showAlert("An error occurred during execution: " + error.message);
  }
}

function toggleTreeButtons() {
  startBtn.disabled = treeRunning;
  pauseBtn.disabled = !treeRunning;
  stepBtn.disabled = treeRunning;
  resetBtn.disabled = false;
  functionSelect.disabled = treeRunning || treeGenerator !== null;
  inputValue.disabled = treeRunning || treeGenerator !== null;
  
  if (inputGroup2.style.display !== "none") {
    inputValue2.disabled = treeRunning || treeGenerator !== null;
  }
  
  if (arrayInputGroup.style.display !== "none") {
    inputArray.disabled = treeRunning || treeGenerator !== null;
  }
}

function updateTreeVisualization(frame) {
  if (!frame) return;
  
  console.log("Processing tree frame:", frame);
  
  if (frame.type === "call") {
    // Create or update node for this call
    const node = {
      id: frame.id,
      type: "call",
      func: frame.func,
      arg: frame.arg,
      parent: frame.parent,
      children: [],
      status: "executing", // active, executing, returned
      local: frame.local,
      value: null,
      x: 0,
      y: 0,
      width: nodeSize.width,
      height: nodeSize.height
    };
    
    // Store the node
    treeNodes[frame.id] = node;
    
    // If childId is specified, add to parent's children
    if (frame.childId) {
      if (treeNodes[frame.id]) {
        treeNodes[frame.id].children.push(frame.childId);
      }
    }
    
    // If this is first node, set as root
    if (!rootNodeId) {
      rootNodeId = frame.id;
    }
  } 
  else if (frame.type === "return") {
    // Update the node with return value
    if (treeNodes[frame.id]) {
      treeNodes[frame.id].value = frame.value;
      treeNodes[frame.id].status = "returned";
      treeNodes[frame.id].local = frame.local;
    }
  }
  
  // Calculate layout after updating nodes
  calculateTreeLayout();
  
  // Draw the tree
  drawTree();
}

function calculateTreeLayout() {
  if (!rootNodeId || Object.keys(treeNodes).length === 0) return;
  
  // Reset positions
  Object.values(treeNodes).forEach(node => {
    node.x = 0;
    node.y = 0;
    node.width = nodeSize.width;
    node.height = nodeSize.height;
  });
  
  // Calculate depth and assign y coordinates based on depth
  assignDepths(rootNodeId, 0);
  
  // Calculate horizontal positions to avoid overlaps
  calculateHorizontalPositions();
  
  // Center the tree
  centerTree();
}

function assignDepths(nodeId, depth) {
  if (!treeNodes[nodeId]) return;
  
  const node = treeNodes[nodeId];
  
  // Assign y coordinate based on depth
  node.y = depth * levelHeight + 50;
  
  // Process children
  for (const childId of node.children) {
    assignDepths(childId, depth + 1);
  }
}

function calculateHorizontalPositions() {
  // First pass: calculate subtree widths
  calculateSubtreeWidths(rootNodeId);
  
  // Second pass: assign x coordinates
  positionNodesHorizontally(rootNodeId, 50); // Start with some margin
}

function calculateSubtreeWidths(nodeId) {
  if (!treeNodes[nodeId]) return 0;
  
  const node = treeNodes[nodeId];
  
  if (node.children.length === 0) {
    // Leaf node has fixed width
    node.subtreeWidth = nodeSize.width + horizontalSpacing;
    return node.subtreeWidth;
  }
  
  // Calculate total width of children
  let totalChildrenWidth = 0;
  for (const childId of node.children) {
    totalChildrenWidth += calculateSubtreeWidths(childId);
  }
  
  // Store subtree width (max of own width or children's total)
  node.subtreeWidth = Math.max(nodeSize.width + horizontalSpacing, totalChildrenWidth);
  return node.subtreeWidth;
}

function positionNodesHorizontally(nodeId, xStart) {
  if (!treeNodes[nodeId]) return xStart;
  
  const node = treeNodes[nodeId];
  
  if (node.children.length === 0) {
    // Leaf node
    node.x = xStart + (nodeSize.width / 2);
    return xStart + node.subtreeWidth;
  }
  
  // Position children first
  let childXStart = xStart;
  for (const childId of node.children) {
    childXStart = positionNodesHorizontally(childId, childXStart);
  }
  
  // Position this node centered over its children
  if (node.children.length > 0) {
    const firstChild = treeNodes[node.children[0]];
    const lastChild = treeNodes[node.children[node.children.length - 1]];
    
    if (firstChild && lastChild) {
      node.x = (firstChild.x + lastChild.x) / 2;
    } else {
      node.x = xStart + (nodeSize.width / 2);
    }
  } else {
    node.x = xStart + (nodeSize.width / 2);
  }
  
  return xStart + node.subtreeWidth;
}

function centerTree() {
  // Find the bounds of the tree
  let minX = Infinity;
  let maxX = -Infinity;
  
  Object.values(treeNodes).forEach(node => {
    minX = Math.min(minX, node.x - node.width / 2);
    maxX = Math.max(maxX, node.x + node.width / 2);
  });
  
  // Calculate the offset to center the tree
  const treeWidth = maxX - minX;
  const offset = (canvasWidth - treeWidth) / 2 - minX;
  
  // Apply the offset to all nodes
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
  
  // Draw connections first (so they're behind nodes)
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
    const parent = treeNodes[nodeId];
    
    for (const childId of parent.children) {
      const child = treeNodes[childId];
      if (!child) continue;
      
      treeCtx.beginPath();
      treeCtx.moveTo(parent.x, parent.y + parent.height / 2);
      treeCtx.lineTo(child.x, child.y - child.height / 2);
      treeCtx.stroke();
    }
  }
}

function drawNode(node) {
  // Set color based on node status
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
  
  // Draw node shape
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

// Pan and zoom functionality
let isPanning = false;
let panStart = { x: 0, y: 0 };
let viewOffset = { x: 0, y: 0 };
let zoomLevel = 1;

function setupTreeInteractions() {
  if (!treeCanvas) return;
  
  // Mouse down for panning
  treeCanvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    panStart.x = e.clientX - viewOffset.x;
    panStart.y = e.clientY - viewOffset.y;
    treeCanvas.style.cursor = 'grabbing';
  });
  
  // Mouse move for panning
  treeCanvas.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    
    viewOffset.x = e.clientX - panStart.x;
    viewOffset.y = e.clientY - panStart.y;
    
    // Redraw with new offset
    drawTreeWithTransform();
  });
  
  // Mouse up to end panning
  treeCanvas.addEventListener('mouseup', () => {
    isPanning = false;
    treeCanvas.style.cursor = 'grab';
  });
  
  // Mouse leave to end panning
  treeCanvas.addEventListener('mouseleave', () => {
    isPanning = false;
    treeCanvas.style.cursor = 'grab';
  });
  
  // Wheel for zooming
  treeCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const zoomDirection = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel + zoomDirection));
    
    // Calculate zoom around mouse position
    const mouseX = e.clientX - treeCanvas.getBoundingClientRect().left;
    const mouseY = e.clientY - treeCanvas.getBoundingClientRect().top;
    
    // Adjust viewOffset to zoom around mouse point
    viewOffset.x = mouseX - ((mouseX - viewOffset.x) * (newZoom / zoomLevel));
    viewOffset.y = mouseY - ((mouseY - viewOffset.y) * (newZoom / zoomLevel));
    
    zoomLevel = newZoom;
    
    // Redraw with new zoom
    drawTreeWithTransform();
  });
  
  // Double click to reset view
  treeCanvas.addEventListener('dblclick', () => {
    viewOffset = { x: 0, y: 0 };
    zoomLevel = 1;
    drawTreeWithTransform();
  });
  
  // Set initial cursor
  treeCanvas.style.cursor = 'grab';
}

function drawTreeWithTransform() {
  if (!treeCtx) return;
  
  clearTreeCanvas();
  
  // Apply transformations
  treeCtx.save();
  treeCtx.translate(viewOffset.x, viewOffset.y);
  treeCtx.scale(zoomLevel, zoomLevel);
  
  // Draw the tree with transformations
  drawTree();
  
  // Restore context
  treeCtx.restore();
}

// Add reset zoom button
function addResetViewButton() {
  const resetViewBtn = document.createElement('button');
  resetViewBtn.id = 'resetViewBtn';
  resetViewBtn.textContent = 'Reset View';
  resetViewBtn.className = 'control-btn';
  resetViewBtn.addEventListener('click', () => {
    viewOffset = { x: 0, y: 0 };
    zoomLevel = 1;
    drawTreeWithTransform();
  });
  
  // Add to visualization controls
  const controlsContainer = document.querySelector('.visualization-controls');
  if (controlsContainer) {
    controlsContainer.appendChild(resetViewBtn);
  }
}