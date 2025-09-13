function* factorial(n, parentId = null) {
  // Calculate factorial of n: n! = n * (n-1) * ... * 1
  console.log("Factorial called with n =", n);
  
  const callId = `factorial_${n}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Announce this function call
  yield { 
    type: "call", 
    func: "factorial", 
    arg: n, 
    local: { n },
    id: callId,
    parent: parentId
  };
  
  // Base case
  if (n === 0 || n === 1) {
    yield { 
      type: "return", 
      value: 1, 
      local: { n },
      id: callId
    };
    return 1;
  }
  
  // Get result from recursive call
  const result = yield* factorial(n - 1, callId);
  
  // Calculate final result
  const final = n * result;
  
  // Return result
  yield { 
    type: "return", 
    value: final, 
    local: { n, result },
    id: callId
  };
  
  return final;
}

function* fibonacci(n, parentId = null) {
  // Calculate nth Fibonacci number: F(n) = F(n-1) + F(n-2)
  console.log("Fibonacci called with n =", n);
  
  const callId = `fib_${n}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Announce this function call
  yield { 
    type: "call", 
    func: "fibonacci", 
    arg: n, 
    local: { n },
    id: callId,
    parent: parentId
  };
  
  // Base cases
  if (n === 0) {
    yield { 
      type: "return", 
      value: 0, 
      local: { n },
      id: callId
    };
    return 0;
  }
  
  if (n === 1) {
    yield { 
      type: "return", 
      value: 1, 
      local: { n },
      id: callId
    };
    return 1;
  }
  
  // First recursive call (n-1)
  const a = yield* fibonacci(n - 1, callId);
  
  // Second recursive call (n-2)
  const b = yield* fibonacci(n - 2, callId);
  
  // Calculate final result
  const final = a + b;
  
  // Return result
  yield { 
    type: "return", 
    value: final, 
    local: { n, a, b },
    id: callId
  };
  
  return final;
}

function* gcd(a, b, parentId = null) {
  // Calculate greatest common divisor using the Euclidean algorithm
  console.log("GCD called with a =", a, "b =", b);
  
  // Create unique ID based on both arguments
  const callId = `gcd_${a}_${b}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Announce this function call
  yield { 
    type: "call", 
    func: "gcd", 
    arg: `${a}, ${b}`, 
    local: { a, b },
    id: callId,
    parent: parentId
  };
  
  // Base case
  if (b === 0) {
    yield { 
      type: "return", 
      value: a, 
      local: { a, b },
      id: callId
    };
    return a;
  }
  
  // Recursive call
  const result = yield* gcd(b, a % b, callId);
  
  // Return result
  yield { 
    type: "return", 
    value: result, 
    local: { a, b, result },
    id: callId
  };
  
  return result;
}

function* power(base, exponent, parentId = null) {
  // Calculate base^exponent recursively
  console.log("Power called with base =", base, "exponent =", exponent);
  
  const callId = `power_${base}_${exponent}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Announce this function call
  yield { 
    type: "call", 
    func: "power", 
    arg: `${base}, ${exponent}`, 
    local: { base, exponent },
    id: callId,
    parent: parentId
  };
  
  // Base case
  if (exponent === 0) {
    yield { 
      type: "return", 
      value: 1, 
      local: { base, exponent },
      id: callId
    };
    return 1;
  }
  
  // Recursive call
  const result = yield* power(base, exponent - 1, callId);
  
  // Calculate final result
  const final = base * result;
  
  // Return result
  yield { 
    type: "return", 
    value: final, 
    local: { base, exponent, result },
    id: callId
  };
  
  return final;
}

function* sumArray(arr, index = 0) {
  // Calculate sum of array elements recursively
  console.log("SumArray called with index =", index, "array length =", arr.length);
  
  const callId = `sumArray_${index}`;
  
  // Base case
  if (index >= arr.length) {
    yield { 
      type: "return", 
      value: 0, 
      local: { index, arrLength: arr.length },
      id: callId,
      parent: null
    };
    return 0;
  }
  
  // Recursive call
  const childId = `sumArray_${index+1}`;
  
  yield { 
    type: "call", 
    func: "sumArray", 
    arg: `arr, ${index+1}`, 
    local: { index, current: arr[index], arrLength: arr.length },
    id: callId,
    childId: childId
  };
  
  const result = yield* sumArray(arr, index + 1);
  
  // Calculate final result
  const final = arr[index] + result;
  
  // Return result
  yield { 
    type: "return", 
    value: final, 
    local: { index, current: arr[index], result },
    id: callId,
    parent: index > 0 ? `sumArray_${index-1}` : null
  };
  
  return final;
}