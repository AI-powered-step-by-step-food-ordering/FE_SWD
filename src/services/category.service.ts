import apiClient from './api.config';
import { ApiResponse, Category, CategoryRequest } from '@/types/api.types';

class CategoryService {
  /**
   * Get all categories
   */
  async getAll(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/api/categories/getall');
    return response.data;
  }

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<ApiResponse<Category>> {
    const response = await apiClient.get<ApiResponse<Category>>(`/api/categories/getbyid/${id}`);
    return response.data;
  }

  /**
   * Create new category (Admin only)
   */
  async create(categoryData: CategoryRequest): Promise<ApiResponse<Category>> {
    const response = await apiClient.post<ApiResponse<Category>>(
      '/api/categories/create',
      categoryData
    );
    return response.data;
  }

  /**
   * Update category (Admin only)
   */
  async update(id: string, categoryData: CategoryRequest): Promise<ApiResponse<Category>> {
    const response = await apiClient.put<ApiResponse<Category>>(
      `/api/categories/update/${id}`,
      categoryData
    );
    return response.data;
  }

  /**
   * Delete category (Admin only)
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/categories/delete/${id}`
    );
    return response.data;
  }

  /**
   * Get active categories only
   */
  async getActiveCategories(): Promise<Category[]> {
    const response = await this.getAll();
    if (response.success && response.data) {
      return response.data.filter((cat) => cat.isActive);
    }
    return [];
  }

  /**
   * Get categories by kind
   */
  async getCategoriesByKind(kind: string): Promise<Category[]> {
    const response = await this.getAll();
    if (response.success && response.data) {
      return response.data.filter((cat) => cat.kind === kind && cat.isActive);
    }
    return [];
  }
}

export default new CategoryService();


