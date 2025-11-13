import apiClient from './api.config';
import { ApiResponse, Store, StoreRequest, PagedResponse } from '@/types/api.types';

class StoreService {
  /**
   * Get all stores
   */
  async getAll(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<Store>>> {
    const response = await apiClient.get<ApiResponse<any>>('/api/stores/getall', { params });
    const res = response.data as ApiResponse<any>;
    // If backend returns paged, keep as-is; if returns array, wrap in synthetic page
    if (Array.isArray(res.data)) {
      const arr = res.data as Store[];
      const synthetic: PagedResponse<Store> = {
        content: arr,
        page: 0,
        size: arr.length,
        totalElements: arr.length,
        totalPages: 1,
        first: true,
        last: true,
      };
      return { ...res, data: synthetic } as ApiResponse<PagedResponse<Store>>;
    }
    return res as ApiResponse<PagedResponse<Store>>;
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

  /**
   * Get all stores (legacy method - returns all stores without pagination for client-side filtering)
   */
  async getAllLegacy(): Promise<ApiResponse<Store[]>> {
    const response = await apiClient.get<ApiResponse<any>>('/api/stores/getall');
    const res = response.data as ApiResponse<any>;
    let content: any[] = [];
    if (Array.isArray(res.data)) {
      content = res.data;
    } else if (res?.data?.content && Array.isArray(res.data.content)) {
      content = res.data.content;
    }
    return { ...res, data: content as Store[] } as ApiResponse<Store[]>;
  }
}

const storeService = new StoreService();
export default storeService;
export { storeService };


