import apiClient from './api.config';
import { ApiResponse, Category, CategoryRequest } from '@/types/api.types';

class CategoryService {
  /**
   * Get all categories
   */
  async getAll(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<any[]>>('/api/categories/getall');
    const res = response.data as ApiResponse<any[]>;
    if (res?.data) {
      // Normalize backend `active` -> frontend `isActive`
      res.data = res.data.map((cat: any) => ({
        ...cat,
        isActive: typeof cat.isActive === 'boolean' ? cat.isActive : !!cat.active,
      }));
    }
    return res as ApiResponse<Category[]>;
  }

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<ApiResponse<Category>> {
    const response = await apiClient.get<ApiResponse<any>>(`/api/categories/getbyid/${id}`);
    const res = response.data as ApiResponse<any>;
    if (res?.data) {
      res.data = {
        ...res.data,
        isActive: typeof res.data.isActive === 'boolean' ? res.data.isActive : !!res.data.active,
      };
    }
    return res as ApiResponse<Category>;
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
   * Soft delete category (Admin only) - Sets isActive to false
   */
  async softDelete(id: string): Promise<ApiResponse<Category>> {
    // Get current category data
    const categoryResponse = await this.getById(id);
    if (!categoryResponse.success || !categoryResponse.data) {
      throw new Error('Category not found');
    }

    const categoryData: any = {
      name: categoryResponse.data.name,
      kind: categoryResponse.data.kind,
      displayOrder: categoryResponse.data.displayOrder,
      isActive: false, // frontend field
      active: false,   // backend field compatibility
    };

    const response = await apiClient.put<ApiResponse<Category>>(
      `/api/categories/update/${id}`,
      categoryData
    );
    return response.data;
  }

  /**
   * Restore soft-deleted category (Admin only) - Sets isActive to true
   */
  async restore(id: string): Promise<ApiResponse<Category>> {
    // Get current category data
    const categoryResponse = await this.getById(id);
    if (!categoryResponse.success || !categoryResponse.data) {
      throw new Error('Category not found');
    }

    const categoryData: any = {
      name: categoryResponse.data.name,
      kind: categoryResponse.data.kind,
      displayOrder: categoryResponse.data.displayOrder,
      isActive: true,  // frontend field
      active: true,    // backend field compatibility
    };

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
   * Get inactive categories (Admin only)
   */
  async getInactive(): Promise<ApiResponse<Category[]>> {
    const response = await this.getAll();
    if (response.success && response.data) {
      const inactiveCategories = response.data.filter((cat) => !cat.isActive);
      return {
        ...response,
        data: inactiveCategories
      };
    }
    return response;
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

const categoryService = new CategoryService();
export default categoryService;
export { categoryService };


