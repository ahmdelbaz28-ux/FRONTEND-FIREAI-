import { actions } from "@/store/simpleStore";

export class DataService {
  private static instance: DataService;
  private socket: WebSocket | null = null;
  private buffer: any[] = [];
  private maxBufferSize = 50;
  private reconnectInterval = 5000;
  private isConnected = false;
  private url: string = "ws://localhost:8080"; // Mock URL

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  public connect() {
    if (this.isConnected) return;

    actions.addLog("Attempting to connect to Live Data Server...");
    
    // In a real app, this would be: this.socket = new WebSocket(this.url);
    // For this mock environment, we will simulate the WebSocket behavior.
    
    setTimeout(() => {
      this.simulateConnection();
    }, 1000);
  }

  private simulateConnection() {
    this.isConnected = true;
    actions.setConnectionStatus("connected");
    actions.addLog("Connected to Live Data Server (MOCK).");

    if (this.buffer.length > 0) {
      actions.addLog(`[SYSTEM] Restored ${this.buffer.length} buffered readings. Data Gap detected.`);
      this.buffer = []; // Clear buffer after restoring
    }

    // Start listening to the mock server events
    window.addEventListener("mock-server-data", this.handleMessage as any);
  }

  public disconnect() {
    this.isConnected = false;
    actions.setConnectionStatus("disconnected");
    actions.addLog("Disconnected from Live Data Server.");
    window.removeEventListener("mock-server-data", this.handleMessage as any);
  }

  private handleMessage = (event: CustomEvent) => {
    if (!this.isConnected) {
      // Buffer data if disconnected
      if (this.buffer.length < this.maxBufferSize) {
        this.buffer.push(event.detail);
      }
      return;
    }

    const data = event.detail;
    
    // Update store
    actions.updateLiveData({
      voltage: data.voltage,
      current: data.current,
      frequency: data.frequency
    });

    // Randomly inject faults based on server data if needed
    if (data.fault) {
      actions.addFault(data.fault);
      actions.addLog(`CRITICAL: Server reported fault on ${data.fault}`);
    }
  };

  // Method to simulate network drop for testing
  public simulateDrop() {
    if (!this.isConnected) return;
    
    this.isConnected = false;
    actions.setConnectionStatus("disconnected");
    actions.addLog("Connection lost! Buffering incoming data...");
    
    // Auto reconnect after some time
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }
}

export const dataService = DataService.getInstance();
