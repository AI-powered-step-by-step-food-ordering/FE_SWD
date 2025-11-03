import apiClient from './api.config';
import { ApiResponse, Store, StoreRequest, PageRequest, PaginatedApiResponse } from '@/types/api.types';

class StoreService {
  /**
   * Get all stores with pagination, search, and sort
   */
  async getAll(params?: PageRequest): Promise<PaginatedApiResponse<Store>> {
    // Align with backend: /api/stores/getall?page=&size=&sortBy=&sortDir=
    let url = '/api/stores/getall';
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      const anyParams = params as any;
      let sortBy: string | undefined;
      let sortDir: string | undefined;
      if (params.sort) {
        const [field, direction] = params.sort.split(',');
        sortBy = field;
        sortDir = direction || 'desc';
      } else if (anyParams.sortField || anyParams.sortDirection) {
        sortBy = anyParams.sortField;
        sortDir = anyParams.sortDirection;
      }
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortDir) queryParams.append('sortDir', sortDir);
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await apiClient.get<PaginatedApiResponse<Store>>(url);
    return response.data;
  }

  /**
   * Get all stores (legacy method for backward compatibility)
   */
  async getAllLegacy(): Promise<ApiResponse<Store[]>> {
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

const storeService = new StoreService();
export default storeService;
export { storeService };


