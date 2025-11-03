import apiClient from './api.config';
import { ApiResponse, Ingredient, IngredientRequest, PageRequest, PaginatedApiResponse } from '@/types/api.types';

class IngredientService {
  /**
   * Get all ingredients with pagination, search, and sort
   */
  async getAll(params?: PageRequest): Promise<PaginatedApiResponse<Ingredient>> {
    // Align with backend: /api/ingredients/getall?page=&size=&sortBy=&sortDir=
    let url = '/api/ingredients/getall';
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

    const response = await apiClient.get<PaginatedApiResponse<Ingredient>>(url);
    return response.data;
  }

  /**
   * Get all ingredients (legacy method for backward compatibility)
   */
  async getAllLegacy(): Promise<ApiResponse<Ingredient[]>> {
    const response = await apiClient.get<ApiResponse<Ingredient[]>>('/api/ingredients');
    return response.data;
  }

  /**
   * Get ingredient by ID
   */
  async getById(id: string): Promise<ApiResponse<Ingredient>> {
    const response = await apiClient.get<ApiResponse<Ingredient>>(`/api/ingredients/getbyid/${id}`);
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
    const response = await this.getAll();
    if (response.success && response.data) {
      const list = response.data.content ?? [];
      return list.filter((ingredient: Ingredient) => ingredient.categoryId === categoryId);
    }
    return [];
  }
}

const ingredientService = new IngredientService();
export default ingredientService;
export { ingredientService };


