import apiClient from './api.config';
import { ApiResponse, Ingredient, IngredientRequest, PagedResponse } from '@/types/api.types';

class IngredientService {
  /**
   * Get all ingredients
   */
  async getAll(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<Ingredient>>> {
    const response = await apiClient.get<ApiResponse<any>>('/api/ingredients/getall', { params });
    const res = response.data as ApiResponse<any>;
    if (Array.isArray(res.data)) {
      const arr = res.data as Ingredient[];
      const synthetic: PagedResponse<Ingredient> = {
        content: arr,
        page: 0,
        size: arr.length,
        totalElements: arr.length,
        totalPages: 1,
        first: true,
        last: true,
      };
      return { ...res, data: synthetic } as ApiResponse<PagedResponse<Ingredient>>;
    }
    return res as ApiResponse<PagedResponse<Ingredient>>;
  }

  /**
   * Get ingredient by ID
   */
  async getById(id: string): Promise<ApiResponse<Ingredient>> {
    const response = await apiClient.get<ApiResponse<Ingredient>>(`/api/ingredients/getbyid/${id}`);
    return response.data;
  }

  /**
   * Get ingredients by Category (paged) - backend native endpoint
   */
  async getByCategoryPaged(
    categoryId: string,
    params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }
  ): Promise<ApiResponse<PagedResponse<Ingredient>>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<Ingredient>>>(
      `/api/ingredients/category/${encodeURIComponent(categoryId)}`,
      { params }
    );
    return response.data;
  }

  /**
   * Create new ingredient (Admin only)
   */
  async create(ingredientData: IngredientRequest): Promise<ApiResponse<Ingredient>> {
    const response = await apiClient.post<ApiResponse<Ingredient>>(
      '/api/ingredients/create',
      ingredientData
    );
    return response.data;
  }

  /**
   * Update ingredient (Admin only)
   */
  async update(id: string, ingredientData: IngredientRequest): Promise<ApiResponse<Ingredient>> {
    const response = await apiClient.put<ApiResponse<Ingredient>>(
      `/api/ingredients/update/${id}`,
      ingredientData
    );
    return response.data;
  }

  /**
   * Get active ingredients
   */
  async getActive(): Promise<ApiResponse<Ingredient[]>> {
    const response = await apiClient.get<ApiResponse<Ingredient[]>>('/api/ingredients/active');
    return response.data;
  }

  /**
   * Get inactive ingredients (Admin only)
   */
  async getInactive(): Promise<ApiResponse<Ingredient[]>> {
    const response = await apiClient.get<ApiResponse<Ingredient[]>>('/api/ingredients/inactive');
    return response.data;
  }

  /**
   * Soft delete ingredient (Admin only)
   */
  async softDelete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.put<ApiResponse<Record<string, never>>>(
      `/api/ingredients/soft-delete/${id}`
    );
    return response.data;
  }

  /**
   * Restore soft-deleted ingredient (Admin only)
   */
  async restore(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.put<ApiResponse<Record<string, never>>>(
      `/api/ingredients/restore/${id}`
    );
    return response.data;
  }

  /**
   * Delete ingredient (Admin only)
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/ingredients/delete/${id}`
    );
    return response.data;
  }

  /**
   * Get ingredients by category
   */
  async getByCategory(categoryId: string): Promise<Ingredient[]> {
    const response = await this.getByCategoryPaged(categoryId, { page: 0, size: 500 });
    return response.data?.content || [];
  }

  /**
   * Get all ingredients (legacy method - returns all ingredients without pagination for client-side filtering)
   */
  async getAllLegacy(): Promise<ApiResponse<Ingredient[]>> {
    const response = await apiClient.get<ApiResponse<any>>('/api/ingredients/getall');
    const res = response.data as ApiResponse<any>;
    let content: any[] = [];
    if (Array.isArray(res.data)) {
      content = res.data;
    } else if (res?.data?.content && Array.isArray(res.data.content)) {
      content = res.data.content;
    }
    return { ...res, data: content as Ingredient[] } as ApiResponse<Ingredient[]>;
  }
}

const ingredientService = new IngredientService();
export default ingredientService;
export { ingredientService };


