import apiClient from './api.config';
import { ApiResponse, Ingredient, IngredientRequest } from '@/types/api.types';

class IngredientService {
  /**
   * Get all ingredients
   */
  async getAll(): Promise<ApiResponse<Ingredient[]>> {
    const response = await apiClient.get<ApiResponse<Ingredient[]>>('/api/ingredients/getall');
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
      return response.data.filter((ingredient) => ingredient.categoryId === categoryId);
    }
    return [];
  }
}

const ingredientService = new IngredientService();
export default ingredientService;
export { ingredientService };


