import apiClient from './api.config';
import { ApiResponse, Promotion, PromotionRequest } from '@/types/api.types';

class PromotionService {
  /**
   * Get all promotions
   */
  async getAll(): Promise<ApiResponse<Promotion[]>> {
    const response = await apiClient.get<ApiResponse<Promotion[]>>('/api/promotions/getall');
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

export default new PromotionService();


