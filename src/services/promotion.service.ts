import apiClient from './api.config';
import { ApiResponse, Promotion, PromotionRequest } from '@/types/api.types';

class PromotionService {
  /**
   * Get all promotions
   * Normalizes backend responses (array or paginated) to a plain array in `data`.
   */
  async getAll(): Promise<ApiResponse<Promotion[]>> {
    const response = await apiClient.get<any>('/api/promotions/getall');
    const raw: any = response.data;

    // If data is already an array, return as-is
    if (Array.isArray(raw?.data)) {
      return raw as ApiResponse<Promotion[]>;
    }

    // If backend returns paginated object, flatten content to array
    const content = raw?.data?.content ?? raw?.content;
    if (Array.isArray(content)) {
      return { ...raw, data: content } as ApiResponse<Promotion[]>;
    }

    // Fallback: return raw response
    return raw as ApiResponse<Promotion[]>;
  }

  /**
   * Search promotions with server-side filtering, pagination, and sorting
   * Backend expects: name, types (not searchText)
   */
  async search(params?: { 
    searchText?: string;
    types?: string[];
    page?: number; 
    size?: number; 
    sortBy?: string; 
    sortDir?: 'asc' | 'desc' 
  }): Promise<ApiResponse<import('@/types/api.types').PagedResponse<Promotion>>> {
    const searchParams = new URLSearchParams();

    // Backend expects 'name' parameter, not 'searchText'
    if (params?.searchText) searchParams.append('name', params.searchText.trim());
    if (params?.types && params.types.length > 0) {
      params.types.forEach(type => searchParams.append('types', type));
    }
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<any>(`/api/promotions/search?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get all promotions with pagination
   */
  async getAllPaged(params?: { 
    page?: number; 
    size?: number; 
    sortBy?: string; 
    sortDir?: 'asc' | 'desc' 
  }): Promise<ApiResponse<import('@/types/api.types').PagedResponse<Promotion>>> {
    const searchParams = new URLSearchParams();

    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<any>(`/api/promotions/getall?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get active promotions with pagination
   */
  async getActive(params?: { 
    page?: number; 
    size?: number; 
    sortBy?: string; 
    sortDir?: 'asc' | 'desc' 
  }): Promise<ApiResponse<import('@/types/api.types').PagedResponse<Promotion>>> {
    const searchParams = new URLSearchParams();

    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<any>(`/api/promotions/active?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get inactive promotions with pagination
   */
  async getInactive(params?: { 
    page?: number; 
    size?: number; 
    sortBy?: string; 
    sortDir?: 'asc' | 'desc' 
  }): Promise<ApiResponse<import('@/types/api.types').PagedResponse<Promotion>>> {
    const searchParams = new URLSearchParams();

    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<any>(`/api/promotions/inactive?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get promotion by ID
   */
  async getById(id: string): Promise<ApiResponse<Promotion>> {
    const response = await apiClient.get<ApiResponse<Promotion>>(`/api/promotions/getbyid/${id}`);
    return response.data;
  }

  /**
   * Create new promotion (Admin only)
   */
  async create(promotionData: PromotionRequest): Promise<ApiResponse<Promotion>> {
    const response = await apiClient.post<ApiResponse<Promotion>>(
      '/api/promotions/create',
      promotionData
    );
    return response.data;
  }

  /**
   * Update promotion (Admin only)
   */
  async update(id: string, promotionData: PromotionRequest): Promise<ApiResponse<Promotion>> {
    const response = await apiClient.put<ApiResponse<Promotion>>(
      `/api/promotions/update/${id}`,
      promotionData
    );
    return response.data;
  }

  /**
   * Delete promotion (Admin only)
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/promotions/delete/${id}`
    );
    return response.data;
  }

  /**
   * Get active promotions
   */
  async getActivePromotions(): Promise<Promotion[]> {
    const response = await this.getAll();
    if (response.success && response.data) {
      const now = new Date();
      return response.data.filter((promo) => {
        if (!promo.isActive) return false;
        if (promo.startsAt && new Date(promo.startsAt) > now) return false;
        if (promo.endsAt && new Date(promo.endsAt) < now) return false;
        return true;
      });
    }
    return [];
  }
}

const promotionService = new PromotionService();
export default promotionService;
export { promotionService };


