import apiClient from './api.config';
import { ApiResponse, Store, StoreRequest } from '@/types/api.types';

class StoreService {
  /**
   * Get all stores
   */
  async getAll(): Promise<ApiResponse<Store[]>> {
    const response = await apiClient.get<ApiResponse<Store[]>>('/api/stores/getall');
    return response.data;
  }

  /**
   * Get store by ID
   */
  async getById(id: string): Promise<ApiResponse<Store>> {
    const response = await apiClient.get<ApiResponse<Store>>(`/api/stores/getbyid/${id}`);
    return response.data;
  }

  /**
   * Create new store (Admin only)
   */
  async create(storeData: StoreRequest): Promise<ApiResponse<Store>> {
    const response = await apiClient.post<ApiResponse<Store>>(
      '/api/stores/create',
      storeData
    );
    return response.data;
  }

  /**
   * Update store (Admin only)
   */
  async update(id: string, storeData: StoreRequest): Promise<ApiResponse<Store>> {
    const response = await apiClient.put<ApiResponse<Store>>(
      `/api/stores/update/${id}`,
      storeData
    );
    return response.data;
  }

  /**
   * Delete store (Admin only)
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/stores/delete/${id}`
    );
    return response.data;
  }
}

export default new StoreService();


