import apiClient from './api.config';
import { ApiResponse, Bowl, BowlRequest, BowlItem, BowlItemRequest } from '@/types/api.types';

class BowlService {
  /**
   * Get all bowls
   */
  async getAll(): Promise<ApiResponse<Bowl[]>> {
    const response = await apiClient.get<ApiResponse<Bowl[]>>('/api/bowls/getall');
    return response.data;
  }

  /**
   * Get bowl by ID
   */
  async getById(id: string): Promise<ApiResponse<Bowl>> {
    const response = await apiClient.get<ApiResponse<Bowl>>(`/api/bowls/getbyid/${id}`);
    return response.data;
  }

  /**
   * Create new bowl
   */
  async create(bowlData: BowlRequest): Promise<ApiResponse<Bowl>> {
    const response = await apiClient.post<ApiResponse<Bowl>>(
      '/api/bowls/create',
      bowlData
    );
    return response.data;
  }

  /**
   * Update bowl
   */
  async update(id: string, bowlData: BowlRequest): Promise<ApiResponse<Bowl>> {
    const response = await apiClient.put<ApiResponse<Bowl>>(
      `/api/bowls/update/${id}`,
      bowlData
    );
    return response.data;
  }

  /**
   * Delete bowl
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/bowls/delete/${id}`
    );
    return response.data;
  }

  // Bowl Items Methods
  /**
   * Get all bowl items
   */
  async getAllItems(): Promise<ApiResponse<BowlItem[]>> {
    const response = await apiClient.get<ApiResponse<BowlItem[]>>('/api/bowl_items/getall');
    return response.data;
  }

  /**
   * Get bowl item by ID
   */
  async getItemById(id: string): Promise<ApiResponse<BowlItem>> {
    const response = await apiClient.get<ApiResponse<BowlItem>>(`/api/bowl_items/getbyid/${id}`);
    return response.data;
  }

  /**
   * Create new bowl item
   */
  async createItem(bowlItemData: BowlItemRequest): Promise<ApiResponse<BowlItem>> {
    const response = await apiClient.post<ApiResponse<BowlItem>>(
      '/api/bowl_items/create',
      bowlItemData
    );
    return response.data;
  }

  /**
   * Update bowl item
   */
  async updateItem(id: string, bowlItemData: BowlItemRequest): Promise<ApiResponse<BowlItem>> {
    const response = await apiClient.put<ApiResponse<BowlItem>>(
      `/api/bowl_items/update/${id}`,
      bowlItemData
    );
    return response.data;
  }

  /**
   * Delete bowl item
   */
  async deleteItem(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/bowl_items/delete/${id}`
    );
    return response.data;
  }
}

export default new BowlService();


