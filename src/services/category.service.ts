import apiClient from './api.config';
import { ApiResponse, Category, CategoryRequest, PageRequest, PaginatedApiResponse } from '@/types/api.types';

class CategoryService {
  /**
   * Get all categories with pagination, search, and sort
   */
  async getAll(params?: PageRequest): Promise<PaginatedApiResponse<Category>> {
    // Align with backend: /api/categories/getall?page=&size=&sortBy=&sortDir=
    const queryParams = new URLSearchParams();

    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());

    const anyParams = params as any;
    let sortBy: string | undefined;
    let sortDir: string | undefined;
    if (params?.sort) {
      const [field, direction] = params.sort.split(',');
      sortBy = field;
      sortDir = direction || 'desc';
    } else if (anyParams?.sortField || anyParams?.sortDirection) {
      sortBy = anyParams.sortField;
      sortDir = anyParams.sortDirection;
    }
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortDir) queryParams.append('sortDir', sortDir);

    const url = `/api/categories/getall${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<PaginatedApiResponse<Category>>(url);
    
    // Normalize the active field for frontend compatibility
    if (response.data.success && response.data.data.content) {
      response.data.data.content = response.data.data.content.map(category => ({
        ...category,
        isActive: category.isActive ?? (category as any).active ?? true
      }));
    }
    
    return response.data;
  }

  /**
   * Get all categories (legacy method for backward compatibility)
   */
  async getAllLegacy(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/api/categories');
    
    // Normalize the active field for frontend compatibility
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(category => ({
        ...category,
        isActive: category.isActive ?? (category as any).active ?? true
      }));
    }
    
    return response.data;
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
    const response = await this.getAllLegacy();
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
    const response = await this.getAllLegacy();
    if (response.success && response.data) {
      return response.data.filter((cat) => cat.isActive);
    }
    return [];
  }

  /**
   * Get categories by kind
   */
  async getCategoriesByKind(kind: string): Promise<Category[]> {
    const response = await this.getAllLegacy();
    if (response.success && response.data) {
      return response.data.filter((cat) => cat.kind === kind && cat.isActive);
    }
    return [];
  }
}

const categoryService = new CategoryService();
export default categoryService;
export { categoryService };


