import type { ApiResponse } from '@/types/api';

const API_BASE_URL = 'http://cinezone.info:4458/api';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors', // Explicitly set CORS mode
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Provide helpful error message for CORS issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to API. Please ensure the backend server is running and CORS is configured properly.');
      }
      
      throw error;
    }
  }

  // Generic CRUD operations
  async getAll<T>(resource: string): Promise<ApiResponse<T[]>> {
    return this.request<T[]>(`/${resource}/getall`);
  }

  async getById<T>(resource: string, id: string): Promise<ApiResponse<T>> {
    return this.request<T>(`/${resource}/getbyid/${id}`);
  }

  async create<T, R>(resource: string, data: R): Promise<ApiResponse<T>> {
    return this.request<T>(`/${resource}/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update<T, R>(resource: string, id: string, data: R): Promise<ApiResponse<T>> {
    return this.request<T>(`/${resource}/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(resource: string, id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/${resource}/delete/${id}`, {
      method: 'DELETE',
    });
  }

  // Order specific operations
  async confirmOrder(id: string): Promise<ApiResponse<any>> {
    return this.request(`/orders/confirm/${id}`, {
      method: 'POST',
    });
  }

  async cancelOrder(id: string, reason?: string): Promise<ApiResponse<any>> {
    const url = reason ? `/orders/cancel/${id}?reason=${encodeURIComponent(reason)}` : `/orders/cancel/${id}`;
    return this.request(url, {
      method: 'POST',
    });
  }

  async completeOrder(id: string): Promise<ApiResponse<any>> {
    return this.request(`/orders/complete/${id}`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
