// Simple worker for simulated heavy calculations
self.onmessage = (e) => {
  const { type, data } = e.data;

  if (type === "calculate_load_flow") {
    // Simulate heavy calculation
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
      result += Math.sqrt(i);
    }
    self.postMessage({ type: "result", data: { result, originalData: data } });
  }
};
