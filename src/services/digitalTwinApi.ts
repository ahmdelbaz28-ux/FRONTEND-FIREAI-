/**
 * digitalTwinApi.ts - REST API Client for Digital Twin Backend
 * Supports retry logic, timeouts, and WebSocket real-time subscription
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// API CLIENT
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private wsConnection: WebSocket | null = null;
  private wsCallbacks: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Client-Version': '1.0.0',
    };
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = 'Bearer ' + token;
  }

  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number = MAX_RETRIES,
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.defaultHeaders, ...options.headers },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'HTTP ' + response.status);
      }

      return {
        success: true,
        data: data?.data || data,
        message: data?.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(RETRY_DELAY * (MAX_RETRIES - retries + 1));
        return this.fetchWithRetry<T>(url, options, retries - 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof DOMException && error.name === 'AbortError') return true;
    if (error instanceof TypeError) return true;
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    }
    return this.fetchWithRetry<T>(url.toString(), { method: 'GET' });
  }

  async post<T>(path: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(path.startsWith('http') ? path : this.baseUrl + path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(path.startsWith('http') ? path : this.baseUrl + path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(path.startsWith('http') ? path : this.baseUrl + path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(path.startsWith('http') ? path : this.baseUrl + path, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // WEBSOCKET
  // ============================================================================

  connectWebSocket(channel: string, callback: (data: unknown) => void): void {
    if (!this.wsConnection || this.wsConnection.readyState === WebSocket.CLOSED) {
      const wsUrl = this.baseUrl.replace('http', 'ws').replace('/api', '/ws');
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('WebSocket connected');
      };

      this.wsConnection.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(() => this.reconnectWebSocket(), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }

    if (!this.wsCallbacks.has(channel)) {
      this.wsCallbacks.set(channel, new Set());
    }
    this.wsCallbacks.get(channel)!.add(callback);

    this.wsConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.channel === channel) {
          this.wsCallbacks.get(channel)?.forEach((cb) => cb(message.data));
        }
      } catch {
        // Ignore parse errors
      }
    };
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
      this.wsCallbacks.clear();
    }
  }

  private reconnectWebSocket(): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.CLOSED) {
      const channel = Array.from(this.wsCallbacks.keys())[0];
      if (channel) {
        const callbacks = this.wsCallbacks.get(channel);
        this.wsCallbacks.clear();
        this.connectWebSocket(channel, () => {});
        callbacks?.forEach((cb) => this.connectWebSocket(channel, cb));
      }
    }
  }

  // ============================================================================
  // PROJECT ENDPOINTS
  // ============================================================================

  async getProjects(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Project>>> {
    return this.get<PaginatedResponse<Project>>('/projects', params as Record<string, string>);
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.get<Project>('/projects/' + id);
  }

  async createProject(data: CreateProjectInput): Promise<ApiResponse<Project>> {
    return this.post<Project>('/projects', data);
  }

  async updateProject(id: string, data: UpdateProjectInput): Promise<ApiResponse<Project>> {
    return this.put<Project>('/projects/' + id, data);
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>('/projects/' + id);
  }

  // ============================================================================
  // DEVICE ENDPOINTS
  // ============================================================================

  async getDevices(projectId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Device>>> {
    return this.get<PaginatedResponse<Device>>('/projects/' + projectId + '/devices', params as Record<string, string>);
  }

  async getDevice(projectId: string, deviceId: string): Promise<ApiResponse<Device>> {
    return this.get<Device>('/projects/' + projectId + '/devices/' + deviceId);
  }

  async createDevice(projectId: string, data: CreateDeviceInput): Promise<ApiResponse<Device>> {
    return this.post<Device>('/projects/' + projectId + '/devices', data);
  }

  async updateDevice(projectId: string, deviceId: string, data: UpdateDeviceInput): Promise<ApiResponse<Device>> {
    return this.put<Device>('/projects/' + projectId + '/devices/' + deviceId, data);
  }

  async deleteDevice(projectId: string, deviceId: string): Promise<ApiResponse<void>> {
    return this.delete<void>('/projects/' + projectId + '/devices/' + deviceId);
  }

  // ============================================================================
  // CONNECTION ENDPOINTS
  // ============================================================================

  async getConnections(projectId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Connection>>> {
    return this.get<PaginatedResponse<Connection>>('/projects/' + projectId + '/connections', params as Record<string, string>);
  }

  async createConnection(projectId: string, data: CreateConnectionInput): Promise<ApiResponse<Connection>> {
    return this.post<Connection>('/projects/' + projectId + '/connections', data);
  }

  async deleteConnection(projectId: string, connectionId: string): Promise<ApiResponse<void>> {
    return this.delete<void>('/projects/' + projectId + '/connections/' + connectionId);
  }

  // ============================================================================
  // REPORT ENDPOINTS
  // ============================================================================

  async generateReport(projectId: string, data: GenerateReportInput): Promise<ApiResponse<Report>> {
    return this.post<Report>('/projects/' + projectId + '/reports', data);
  }

  async getReports(projectId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Report>>> {
    return this.get<PaginatedResponse<Report>>('/projects/' + projectId + '/reports', params as Record<string, string>);
  }

  async getReport(projectId: string, reportId: string): Promise<ApiResponse<Report>> {
    return this.get<Report>('/projects/' + projectId + '/reports/' + reportId);
  }

  async exportReport(projectId: string, reportId: string, format: string): Promise<Blob> {
    const response = await fetch(this.baseUrl + '/projects/' + projectId + '/reports/' + reportId + '/export?format=' + format, {
      headers: this.defaultHeaders,
    });
    return response.blob();
  }

  // ============================================================================
  // EXPORT ENDPOINTS
  // ============================================================================

  async exportToDXF(projectId: string): Promise<Blob> {
    const response = await fetch(this.baseUrl + '/projects/' + projectId + '/export/dxf', {
      headers: this.defaultHeaders,
    });
    return response.blob();
  }

  async exportToRevit(projectId: string): Promise<Blob> {
    const response = await fetch(this.baseUrl + '/projects/' + projectId + '/export/revit', {
      headers: this.defaultHeaders,
    });
    return response.blob();
  }

  async exportToIFC(projectId: string, version: string = 'IFC4'): Promise<Blob> {
    const response = await fetch(this.baseUrl + '/projects/' + projectId + '/export/ifc?version=' + version, {
      headers: this.defaultHeaders,
    });
    return response.blob();
  }

  // ============================================================================
  // SYNC ENDPOINTS
  // ============================================================================

  async syncProject(projectId: string): Promise<ApiResponse<SyncStatus>> {
    return this.post<SyncStatus>('/projects/' + projectId + '/sync');
  }

  async getSyncStatus(projectId: string): Promise<ApiResponse<SyncStatus>> {
    return this.get<SyncStatus>('/projects/' + projectId + '/sync');
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<ApiResponse<HealthStatus>> {
    return this.get<HealthStatus>('/health');
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'draft';
  deviceCount: number;
  connectionCount: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  author?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: 'active' | 'archived' | 'draft';
}

export interface Device {
  id: string;
  projectId: string;
  type: string;
  name: string;
  category: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  voltage: number;
  current: number;
  load: number;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceInput {
  type: string;
  name: string;
  category: string;
  x: number;
  y: number;
  z?: number;
  rotation?: number;
  voltage?: number;
  current?: number;
  load?: number;
  properties?: Record<string, unknown>;
}

export interface UpdateDeviceInput {
  name?: string;
  x?: number;
  y?: number;
  z?: number;
  rotation?: number;
  voltage?: number;
  current?: number;
  load?: number;
  properties?: Record<string, unknown>;
}

export interface Connection {
  id: string;
  projectId: string;
  fromId: string;
  toId: string;
  cableSize: string;
  length: number;
  type: string;
  createdAt: string;
}

export interface CreateConnectionInput {
  fromId: string;
  toId: string;
  cableSize?: string;
  length?: number;
  type?: string;
}

export interface Report {
  id: string;
  projectId: string;
  type: string;
  name: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface GenerateReportInput {
  type: string;
  name?: string;
  parameters?: Record<string, unknown>;
}

export interface SyncStatus {
  projectId: string;
  status: 'syncing' | 'synced' | 'error';
  lastSync: string;
  pendingChanges: number;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  timestamp: string;
}

// ============================================================================
// EXPORTED INSTANCE
// ============================================================================

export const api = new ApiClient();
export default api;
