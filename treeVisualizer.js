
let treeCanvas, treeCtx;
let treeNodes = {};
let rootNodeId = null;
let nodeSize = { width: 100, height: 40, horizontalSpacing: 20, verticalSpacing: 80 };
let canvasWidth, canvasHeight;

let treeGenerator = null;
let treeRunning = false;
let treeAnimationTimeout = null;
let treeSpeed = 500; // milliseconds delay between steps
let treeFinalResult = null;

function showAlert(msg) {
  alert(msg);
}

function initTreeVisualizer() {
  treeCanvas = document.getElementById("treeCanvas");
  if (!treeCanvas) {
    showAlert("Canvas element with id 'treeCanvas' not found!");
    return;
  }
  treeCtx = treeCanvas.getContext("2d");
  resizeCanvas();

  window.addEventListener("resize", () => {
    resizeCanvas();
    drawTree();
  });
}

function resizeCanvas() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight * 0.8; // leave space for buttons/input
  treeCanvas.width = canvasWidth;
  treeCanvas.height = canvasHeight;
}

function clearCanvas() {
  treeCtx.clearRect(0, 0, canvasWidth, canvasHeight);
}

function drawNode(node) {
  const x = node.x;
  const y = node.y;
  const w = nodeSize.width;
  const h = nodeSize.height;

  // Node background
  treeCtx.fillStyle = node.status === "executing" ? "#4a90e2" : "#cccccc";
  treeCtx.strokeStyle = "#000000";
  treeCtx.lineWidth = 2;
  treeCtx.fillRect(x, y, w, h);
  treeCtx.strokeRect(x, y, w, h);

  // Text content inside the node
  treeCtx.fillStyle = "#ffffff";
  treeCtx.font = "bold 14px Arial";
  treeCtx.textBaseline = "middle";
  treeCtx.textAlign = "center";

  const funcText = node.func + "(" + node.arg + ")";
  treeCtx.fillText(funcText, x + w / 2, y + h / 3);

  // Value or return value below function call
  treeCtx.font = "italic 12px Arial";
  const valText = node.value === null ? "" : "Return: " + node.value;
  treeCtx.fillText(valText, x + w / 2, y + (2 * h) / 3);
}

function drawConnections() {
  treeCtx.strokeStyle = "#888888";
  treeCtx.lineWidth = 2;

  Object.values(treeNodes).forEach((node) => {
    if (node.children) {
      node.children.forEach((childId) => {
        const child = treeNodes[childId];
        if (child) {
          const startX = node.x + nodeSize.width / 2;
          const startY = node.y + nodeSize.height;
          const endX = child.x + nodeSize.width / 2;
          const endY = child.y;
          treeCtx.beginPath();
          treeCtx.moveTo(startX, startY);
          treeCtx.lineTo(endX, endY);
          treeCtx.stroke();
        }
      });
    }
  });
}

function assignPositions() {
  // Assign Y positions by depth (root = 0)
  function setDepth(nodeId, depth) {
    let node = treeNodes[nodeId];
    if (!node) return;
    node.depth = depth;
    if (node.children) {
      node.children.forEach((childId) => setDepth(childId, depth + 1));
    }
  }

  if (!rootNodeId) return;
  setDepth(rootNodeId, 0);

  // Group nodes by depth
  let levels = {};
  Object.values(treeNodes).forEach((node) => {
    if (!levels[node.depth]) levels[node.depth] = [];
    levels[node.depth].push(node);
  });

  // Assign X positions in each level evenly spaced
  Object.keys(levels).forEach((depth) => {
    let nodesAtLevel = levels[depth];
    let totalWidth = nodesAtLevel.length * nodeSize.width + (nodesAtLevel.length - 1) * nodeSize.horizontalSpacing;
    let startX = (canvasWidth - totalWidth) / 2;

    nodesAtLevel.forEach((node, idx) => {
      node.x = startX + idx * (nodeSize.width + nodeSize.horizontalSpacing);
      node.y = node.depth * (nodeSize.height + nodeSize.verticalSpacing) + 50;
    });
  });
}

function drawTree() {
  clearCanvas();
  assignPositions();
  drawConnections();
  Object.values(treeNodes).forEach(drawNode);
}

function resetTree() {
  treeNodes = {};
  rootNodeId = null;
  treeFinalResult = null;
  clearCanvas();
  document.getElementById("finalResult").textContent = "";
}

function updateTreeVisualization(frame) {
  if (!frame || !frame.id) {
    return;
  }

  if (frame.type === "call") {
    // Create node if not exists
    if (!treeNodes[frame.id]) {
      treeNodes[frame.id] = {
        id: frame.id,
        func: frame.func,
        arg: frame.arg,
        status: "executing",
        value: null,
        children: [],
      };

      if (frame.parent) {
        // Add this node to parent's children
        if (treeNodes[frame.parent]) {
          treeNodes[frame.parent].children.push(frame.id);
        }
      } else {
        rootNodeId = frame.id; // root call
      }
    } else {
      // Node exists - mark executing
      treeNodes[frame.id].status = "executing";
    }
  } else if (frame.type === "return") {
    // Mark node return and update value
    if (treeNodes[frame.id]) {
      treeNodes[frame.id].status = "returned";
      treeNodes[frame.id].value = frame.value;
    }
  }

  drawTree();
}

function runTreeNext() {
  if (!treeRunning) return;

  try {
    const result = treeGenerator.next();

    if (result.done) {
      treeFinalResult = result.value;
      document.getElementById("finalResult").textContent = "Final Result: " + treeFinalResult;
      treeRunning = false;
      toggleTreeButtons();
      return;
    }

    if (result.value) {
      updateTreeVisualization(result.value);
    }

    treeAnimationTimeout = setTimeout(runTreeNext, treeSpeed);
  } catch (error) {
    treeRunning = false;
    toggleTreeButtons();
    showAlert("An error occurred: " + error.message);
  }
}

function toggleTreeButtons() {
  document.getElementById("startBtn").disabled = treeRunning;
  document.getElementById("pauseBtn").disabled = !treeRunning;
  document.getElementById("stepBtn").disabled = treeRunning;
  document.getElementById("resetBtn").disabled = false;
}

function startTree() {
  if (!treeGenerator) {
    showAlert("Please select a function and input before starting.");
    return;
  }
  if (treeRunning) return;

  treeRunning = true;
  toggleTreeButtons();
  runTreeNext();
}

function pauseTree() {
  treeRunning = false;
  clearTimeout(treeAnimationTimeout);
  toggleTreeButtons();
}

function stepTree() {
  if (!treeGenerator) {
    showAlert("Please select a function and input before stepping.");
    return;
  }
  if (treeRunning) return;

  try {
    const result = treeGenerator.next();
    if (result.done) {
      treeFinalResult = result.value;
      document.getElementById("finalResult").textContent = "Final Result: " + treeFinalResult;
      toggleTreeButtons();
      return;
    }

    if (result.value) {
      updateTreeVisualization(result.value);
    }
  } catch (error) {
    showAlert("An error occurred: " + error.message);
  }
}

function resetTreeRun() {
  pauseTree();
  resetTree();
  treeGenerator = null;
  toggleTreeButtons();
}

// =====================
// Example generator for factorial

function* factorial(n, parent = null) {
  const id = `factorial_${n}_${Date.now()}`; // unique id with timestamp
  yield { type: "call", id, func: "factorial", arg: n, parent };

  if (n === 0 || n === 1) {
    yield { type: "return", id, value: 1 };
    return 1;
  } else {
    let subResult = yield* factorial(n - 1, id);
    let result = n * subResult;
    yield { type: "return", id, value: result };
    return result;
  }
}

// Example generator for fibonacci

function* fibonacci(n, parent = null) {
  const id = `fibonacci_${n}_${Date.now()}`;
  yield { type: "call", id, func: "fibonacci", arg: n, parent };

  if (n === 0) {
    yield { type: "return", id, value: 0 };
    return 0;
  }
  if (n === 1) {
    yield { type: "return", id, value: 1 };
    return 1;
  }

  let sub1 = yield* fibonacci(n - 1, id);
  let sub2 = yield* fibonacci(n - 2, id);
  let result = sub1 + sub2;

  yield { type: "return", id, value: result };
  return result;
}

// Call this function to set treeGenerator based on function name and input
function prepareTreeGenerator(funcName, inputValue) {
  if (funcName === "factorial") {
    return factorial(Number(inputValue));
  } else if (funcName === "fibonacci") {
    return fibonacci(Number(inputValue));
  } else {
    showAlert("Function not implemented in visualizer yet.");
    return null;
  }
}
