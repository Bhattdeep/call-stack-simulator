// Core visualization variables
let generator = null;
let running = false;
let speed = 1000;
let stack = [];
let activeNodeId = null;
let finalResult = null;
let animationFrame = null;
let currentFunction = 'factorial';

// DOM elements
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const functionSelect = document.getElementById("functionSelect");
const inputValue = document.getElementById("inputValue");
const inputValue2 = document.getElementById("inputValue2");
const inputArray = document.getElementById("inputArray");
const inputGroup2 = document.getElementById("inputGroup2");
const arrayInputGroup = document.getElementById("arrayInputGroup");
const functionInfo = document.getElementById("functionInfo");
const finalResultDisplay = document.getElementById("finalResult");
const stackCanvas = document.getElementById("stackCanvas");
const stackCtx = stackCanvas.getContext("2d");
const timeComplexity = document.getElementById("timeComplexity");
const spaceComplexity = document.getElementById("spaceComplexity");
const functionDescription = document.getElementById("functionDescription");
const stackTraceContainer = document.getElementById("stackTraceContainer");
const callCountDisplay = document.getElementById("callCount");

// Function metadata


// Call counter
let callCount = 0;

// Performance tracking
let startTime = 0;
let endTime = 0;

// Initial setup
pauseBtn.disabled = true;
resetBtn.disabled = true;

// Stack trace history
let stackHistory = [];

// Event listeners
startBtn.addEventListener("click", startSimulation);
pauseBtn.addEventListener("click", pauseSimulation);
stepBtn.addEventListener("click", stepSimulation);
resetBtn.addEventListener("click", resetSimulation);
speedRange.addEventListener("input", () => {
  speed = Number(speedRange.value);
  speedValue.textContent = `${speed}ms`;
  console.log("Speed set to:", speed);
});

// Function selection handler
functionSelect.addEventListener("change", () => {
  currentFunction = functionSelect.value;
  updateFunctionInfo();
  resetSimulation();
});

// Set initial speed value display
speedValue.textContent = `${speed}ms`;

// Update function info initially
updateFunctionInfo();

// Make stack canvas responsive
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function resizeCanvas() {
  const containerWidth = stackCanvas.parentElement.clientWidth;
  const containerHeight = Math.max(500, window.innerHeight * 0.6);
  
  stackCanvas.width = containerWidth * 0.95;
  stackCanvas.height = containerHeight;
  
  // Redraw the stack with the new dimensions
  if (stack.length > 0) {
    drawStack();
  }
}

function updateFunctionInfo() {
  const metadata = functionMetadata[currentFunction];
  
  // Update function information
  functionDescription.textContent = metadata.description;
  timeComplexity.textContent = metadata.timeComplexity;
  spaceComplexity.textContent = metadata.spaceComplexity;
  
  // Update input fields
  document.getElementById("inputLabel").textContent = metadata.inputLabel;
  
  // Apply appropriate limits based on function complexity
  let maxValue = metadata.maxValue;
  if (currentFunction === "fibonacci") {
    maxValue = 15; // Limit Fibonacci to 15 to prevent visualization issues
  } else if (currentFunction === "factorial") {
    maxValue = 12; // Limit factorial to 12 to prevent overflow
  } else if (currentFunction === "gcd") {
    maxValue = 100; // GCD can handle larger values
  }
  
  inputValue.max = maxValue;
  
  // Show/hide second input
  if (metadata.secondInput) {
    inputGroup2.style.display = "flex";
    document.getElementById("input2Label").textContent = metadata.input2Label;
    inputValue2.max = metadata.maxValue;
  } else {
    inputGroup2.style.display = "none";
  }
  
  // Show/hide array input
  if (metadata.arrayInput) {
    arrayInputGroup.style.display = "flex";
  } else {
    arrayInputGroup.style.display = "none";
  }
}

function startSimulation() {
  const n = parseInt(inputValue.value);
  if (isNaN(n) || n < 0) {
    showAlert("Please enter a valid non-negative number.");
    return;
  }
  
  const metadata = functionMetadata[currentFunction];
  let maxValue = metadata.maxValue;
  
  // Adjust warnings based on function
  if (currentFunction === "fibonacci" && n > 10) {
    showAlert(`Warning: Fibonacci with n > 10 creates many recursive calls. This might cause performance issues.`);
  } else if (currentFunction === "factorial" && n > 10) {
    showAlert(`Warning: Factorial with n > 10 creates large numbers that might not display correctly.`);
  }
  
  if (n > maxValue) {
    showAlert(`Warning: Values larger than ${maxValue} may cause performance issues. Using ${maxValue} instead.`);
    inputValue.value = maxValue;
  }

  if (!generator) {
    console.log("Creating new generator");
    resetVisualization();
    generator = createGenerator();
    
    // Start performance tracking
    startTime = performance.now();
    callCount = 0;
  }
  
  running = true;
  toggleButtons();
  runNext();
}

function pauseSimulation() {
  console.log("Simulation paused");
  running = false;
  toggleButtons();
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

function stepSimulation() {
  if (!generator) {
    const n = parseInt(inputValue.value);
    if (isNaN(n) || n < 0) {
      showAlert("Please enter a valid non-negative number.");
      return;
    }
    
    const metadata = functionMetadata[currentFunction];
    let maxValue = metadata.maxValue;
    
    // Adjust warnings based on function
    if (currentFunction === "fibonacci" && n > 10) {
      showAlert(`Warning: Fibonacci with n > 10 creates many recursive calls. This might cause performance issues.`);
    } else if (currentFunction === "factorial" && n > 10) {
      showAlert(`Warning: Factorial with n > 10 creates large numbers that might not display correctly.`);
    }
    
    if (n > maxValue) {
      showAlert(`Warning: Values larger than ${maxValue} may cause performance issues. Using ${maxValue} instead.`);
      inputValue.value = maxValue;
    }
    
    console.log("Creating new generator for step");
    resetVisualization();
    generator = createGenerator();
    
    // Start performance tracking
    startTime = performance.now();
    callCount = 0;
  }
  runStep();
}

function resetSimulation() {
  console.log("Simulation reset");
  running = false;
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  
  generator = null;
  resetVisualization();
  toggleButtons();
  
  // Reset performance tracking
  callCount = 0;
  callCountDisplay.textContent = "0";
  document.getElementById("executionTime").textContent = "0.00 ms";
}

function resetVisualization() {
  // Reset all visualization data
  stack = [];
  activeNodeId = null;
  finalResult = null;
  finalResultDisplay.textContent = "-";
  stackHistory = [];
  
  // Clear stack canvas
  clearStackCanvas();
  
  // Clear stack trace
  stackTraceContainer.innerHTML = '';
}

function runNext() {
  if (!running) return;
  
  try {
    const result = generator.next();
    console.log("Generator result:", result);
    
    if (result.done) {
      console.log("Generator finished with result:", result.value);
      finalResult = result.value;
      finalResultDisplay.textContent = finalResult;
      running = false;
      toggleButtons();
      
      // Record end time and display execution time
      endTime = performance.now();
      const executionTime = (endTime - startTime).toFixed(2);
      document.getElementById("executionTime").textContent = `${executionTime} ms`;
      
      return;
    }
    
    if (result.value) {
      updateVisualizations(result.value);
      
      // Track call count
      if (result.value.type === "call") {
        callCount++;
        callCountDisplay.textContent = callCount;
      }
    }
    
    animationFrame = requestAnimationFrame(() => {
      setTimeout(runNext, speed);
    });
  } catch (error) {
    console.error("Error in generator:", error);
    running = false;
    toggleButtons();
    showAlert("An error occurred during execution: " + error.message);
  }
}

function runStep() {
  try {
    const result = generator.next();
    console.log("Step result:", result);
    
    if (result.done) {
      console.log("Generator finished (step) with result:", result.value);
      finalResult = result.value;
      finalResultDisplay.textContent = finalResult;
      running = false;
      toggleButtons();
      
      // Record end time and display execution time
      endTime = performance.now();
      const executionTime = (endTime - startTime).toFixed(2);
      document.getElementById("executionTime").textContent = `${executionTime} ms`;
      
      return;
    }
    
    if (result.value) {
      updateVisualizations(result.value);
      
      // Track call count
      if (result.value.type === "call") {
        callCount++;
        callCountDisplay.textContent = callCount;
      }
    }
  } catch (error) {
    console.error("Error in step:", error);
    running = false;
    toggleButtons();
    showAlert("An error occurred during execution: " + error.message);
  }
}

function createGenerator() {
  const func = functionSelect.value;
  console.log(`Creating ${func} generator`);
  
  try {
    if (func === "factorial") {
      const n = parseInt(inputValue.value);
      return factorial(n);
    } else if (func === "fibonacci") {
      const n = parseInt(inputValue.value);
      return fibonacci(n);
    } else if (func === "gcd") {
      const a = parseInt(inputValue.value);
      const b = parseInt(inputValue2.value);
      return gcd(a, b);
    } else if (func === "power") {
      const base = parseInt(inputValue.value);
      const exponent = parseInt(inputValue2.value);
      return power(base, exponent);
    } else if (func === "sumArray") {
      const arr = inputArray.value.split(',').map(item => parseInt(item.trim())).filter(num => !isNaN(num));
      if (arr.length === 0) {
        throw new Error("Please enter valid comma-separated numbers.");
      }
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

function toggleButtons() {
  startBtn.disabled = running;
  pauseBtn.disabled = !running;
  stepBtn.disabled = running;
  resetBtn.disabled = false;
  functionSelect.disabled = running || generator !== null;
  inputValue.disabled = running || generator !== null;
  
  if (inputGroup2.style.display !== "none") {
    inputValue2.disabled = running || generator !== null;
  }
  
  if (arrayInputGroup.style.display !== "none") {
    inputArray.disabled = running || generator !== null;
  }
}

function updateVisualizations(frame) {
  if (!frame) return;
  
  console.log("Processing frame:", frame);
  
  // Update stack visualization
  updateStack(frame);
  
  // Update stack trace history
  updateStackTrace(frame);
}

// Stack visualization functions
function updateStack(frame) {
  if (frame.type === "call") {
    // Add to stack on function call
    stack.push({
      ...frame,
      returning: false
    });
    
    // Add to stack history
    stackHistory.push({
      type: "call",
      func: frame.func,
      arg: frame.arg,
      timestamp: new Date().toLocaleTimeString()
    });
  } else if (frame.type === "return") {
    // On return, pop the last call and add a return frame
    if (stack.length > 0) {
      const lastCall = stack.pop();
      
      // Push a temporary return frame for visualization
      stack.push({
        ...frame,
        returning: true,
        previousInfo: lastCall ? `${lastCall.func}(${lastCall.arg})` : "unknown"
      });
      
      // Add to stack history
      stackHistory.push({
        type: "return",
        func: frame.previousInfo || "unknown",
        value: frame.value,
        timestamp: new Date().toLocaleTimeString()
      });
      
      // After a delay, remove the return frame unless it's the final return
      if (stack.length > 1) {
        setTimeout(() => {
          if (stack.length > 0 && stack[stack.length - 1].returning) {
            stack.pop();
            drawStack();
          }
        }, speed / 2);
      }
    }
  }
  
  drawStack();
}

function clearStackCanvas() {
  stackCtx.clearRect(0, 0, stackCanvas.width, stackCanvas.height);
}

function drawStack() {
  clearStackCanvas();
  
  // Calculate the optimal frame height based on stack size and canvas height
  const availableHeight = stackCanvas.height - 50; // Account for margins and labels
  const minFrameHeight = 40; // Minimum height for a stack frame
  const maxFrameHeight = 60; // Maximum height for a stack frame
  
  // Dynamic frame height calculation
  let frameHeight = Math.max(minFrameHeight, Math.min(maxFrameHeight, availableHeight / Math.max(1, stack.length)));
  
  // Calculate how many frames we can display
  const maxFrames = Math.floor(availableHeight / frameHeight);
  
  // Get the visible portion of the stack
  const visibleStack = stack.slice(-maxFrames);
  
  // Draw stack background
  stackCtx.fillStyle = "#f5f5f5";
  stackCtx.fillRect(0, 0, stackCanvas.width, stackCanvas.height);
  
  // Draw stack frame border
  stackCtx.strokeStyle = "#ddd";
  stackCtx.lineWidth = 2;
  stackCtx.strokeRect(10, 10, stackCanvas.width - 20, stackCanvas.height - 20);
  
  // Draw stack label
  stackCtx.fillStyle = "#333";
  stackCtx.font = "16px Arial";
  stackCtx.fillText("Call Stack", 20, 30);
  
  // Draw stack base
  stackCtx.fillStyle = "#e0e0e0";
  stackCtx.fillRect(30, stackCanvas.height - 30, stackCanvas.width - 60, 20);
  stackCtx.fillStyle = "#333";
  stackCtx.fillText("Stack Base", stackCanvas.width / 2 - 40, stackCanvas.height - 15);
  
  // Show indication of hidden frames if necessary
  if (stack.length > maxFrames) {
    stackCtx.fillStyle = "#e74c3c";
    stackCtx.font = "14px Arial";
    stackCtx.fillText(`+ ${stack.length - maxFrames} more frames`, stackCanvas.width - 150, 30);
  }
  
  // Calculate space between frames (can be 0 if many frames)
  const spacing = Math.max(0, Math.min(5, (availableHeight - visibleStack.length * frameHeight) / Math.max(1, visibleStack.length - 1)));
  
  visibleStack.forEach((frame, i) => {
    // Position calculation with dynamic spacing and sizing
    const y = stackCanvas.height - (i + 1) * (frameHeight + spacing) - 35;
    const width = stackCanvas.width - 100;
    
    // Draw shadow
    stackCtx.fillStyle = "rgba(0, 0, 0, 0.1)";
    stackCtx.fillRect(55, y + 5, Math.max(width, 0), Math.max(frameHeight - 10, 0));
    
    // Color based on frame type
    stackCtx.fillStyle = frame.returning ? "#e74c3c" : "#3498db";
    stackCtx.fillRect(50, y, Math.max(width, 0), Math.max(frameHeight - 10, 0));
    
    // Frame border
    stackCtx.strokeStyle = "#fff";
    stackCtx.lineWidth = 2;
    stackCtx.strokeRect(50, y, Math.max(width, 0), Math.max(frameHeight - 10, 0));
    
    // Frame text
    stackCtx.fillStyle = "#fff";
    
    // Adapt font size based on frame height
    const fontSize = Math.max(12, Math.min(16, frameHeight / 4));
    stackCtx.font = `bold ${fontSize}px Arial`;
    
    if (frame.returning) {
      // Return frame
      stackCtx.fillText(`Return from ${frame.previousInfo}`, 60, y + frameHeight / 3);
      stackCtx.fillText(`Value: ${frame.value}`, 60, y + frameHeight * 2/3);
    } else {
      // Call frame
      const funcCallText = `${frame.func}(${frame.arg})`;
      // Truncate text if too long for the frame
      const maxTextWidth = width - 20;
      if (stackCtx.measureText(funcCallText).width > maxTextWidth) {
        let truncatedText = funcCallText;
        while (stackCtx.measureText(truncatedText + "...").width > maxTextWidth && truncatedText.length > 0) {
          truncatedText = truncatedText.slice(0, -1);
        }
        stackCtx.fillText(truncatedText + "...", 60, y + frameHeight / 3);
      } else {
        stackCtx.fillText(funcCallText, 60, y + frameHeight / 3);
      }
      
      // Show local variables if there's enough space
      if (frame.local && frameHeight > 30) {
        stackCtx.font = `${Math.max(10, fontSize - 2)}px Arial`;
        let vars = Object.entries(frame.local)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ");
        
        // Truncate variables text if too long
        if (stackCtx.measureText("Local vars: " + vars).width > maxTextWidth) {
          let truncatedVars = vars;
          while (stackCtx.measureText("Local vars: " + truncatedVars + "...").width > maxTextWidth && truncatedVars.length > 0) {
            truncatedVars = truncatedVars.slice(0, -1);
          }
          stackCtx.fillText(`Local vars: ${truncatedVars}...`, 60, y + frameHeight * 2/3);
        } else {
          stackCtx.fillText(`Local vars: ${vars}`, 60, y + frameHeight * 2/3);
        }
      }
    }
  });
}

function updateStackTrace(frame) {
  // Check the stack trace container exists
  if (!stackTraceContainer) return;
  
  // Create a new entry
  const entry = document.createElement('div');
  entry.className = frame.type === 'call' ? 'stack-entry call' : 'stack-entry return';
  
  const icon = document.createElement('span');
  icon.className = 'stack-icon';
  icon.innerHTML = frame.type === 'call' ? '📥' : '📤';
  
  const content = document.createElement('div');
  content.className = 'stack-content';
  
  if (frame.type === 'call') {
    content.innerHTML = `<strong>${frame.func}(${frame.arg})</strong>`;
    
    // Add local variables if available
    if (frame.local) {
      const locals = document.createElement('div');
      locals.className = 'locals';
      locals.textContent = `Locals: ${Object.entries(frame.local)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}`;
      content.appendChild(locals);
    }
  } else {
    content.innerHTML = `<strong>Return</strong> with value: ${frame.value}`;
  }
  
  // Add timestamp
  const timestamp = document.createElement('div');
  timestamp.className = 'timestamp';
  timestamp.textContent = new Date().toLocaleTimeString();
  
  entry.appendChild(icon);
  entry.appendChild(content);
  entry.appendChild(timestamp);
  
  // Add to the container
  stackTraceContainer.appendChild(entry);
  
  // Scroll to the bottom
  stackTraceContainer.scrollTop = stackTraceContainer.scrollHeight;
}

function showAlert(message) {
  // Create alert container if it doesn't exist
  let alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alertContainer';
    document.body.appendChild(alertContainer);
  }
  
  // Create alert element
  const alert = document.createElement('div');
  alert.className = 'alert';
  alert.textContent = message;
  
  // Add close button
  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-alert';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function() {
    alert.style.opacity = '0';
    setTimeout(() => {
      alert.remove();
    }, 300);
  };
  
  alert.appendChild(closeBtn);
  alertContainer.appendChild(alert);
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => {
      alert.remove();
    }, 300);
  }, 5000);
}