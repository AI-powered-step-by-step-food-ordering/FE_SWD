import apiClient from './api.config';
import { ApiResponse, Ingredient, IngredientRequest, PagedResponse } from '@/types/api.types';

class IngredientService {
  /**
   * Get all ingredients
   */
  async getAll(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc'; sort?: string }): Promise<ApiResponse<PagedResponse<Ingredient>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    
    let sortBy = params?.sortBy;
    let sortDir = params?.sortDir;
    
    if (params?.sort) {
      const [field, direction] = params.sort.split(',');
      sortBy = field;
      sortDir = (direction as 'asc' | 'desc') || 'desc';
    }
    
    if (sortBy) searchParams.append('sortBy', sortBy);
    if (sortDir) searchParams.append('sortDir', sortDir);
    
    const response = await apiClient.get<ApiResponse<any>>(`/api/ingredients/getall?${searchParams.toString()}`);
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
   * Get all ingredients (legacy method for backward compatibility)
   */
  async getAllLegacy(): Promise<ApiResponse<Ingredient[]>> {
    const response = await apiClient.get<ApiResponse<any>>('/api/ingredients/getall');
    const res = response.data as ApiResponse<any>;
    if (Array.isArray(res.data)) {
      return res as ApiResponse<Ingredient[]>;
    }
    if (res.data?.content) {
      return { ...res, data: res.data.content } as ApiResponse<Ingredient[]>;
    }
    return res as ApiResponse<Ingredient[]>;
  }

  /**
   * Search ingredients with server-side filtering, pagination, and sorting
   * Backend expects: name, categoryId (not searchText)
   */
  async search(params?: { 
    searchText?: string;
    categoryId?: string;
    page?: number; 
    size?: number; 
    sortBy?: string; 
    sortDir?: 'asc' | 'desc' 
  }): Promise<ApiResponse<PagedResponse<Ingredient>>> {
    const searchParams = new URLSearchParams();

    // Backend expects 'name' parameter, not 'searchText'
    if (params?.searchText) searchParams.append('name', params.searchText.trim());
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<Ingredient>>>(`/api/ingredients/search?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get active ingredients with pagination
   */
  async getActive(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<Ingredient>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<Ingredient>>>(`/api/ingredients/active?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get inactive ingredients with pagination
   */
  async getInactive(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<Ingredient>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<Ingredient>>>(`/api/ingredients/inactive?${searchParams.toString()}`);
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
}

const ingredientService = new IngredientService();
export default ingredientService;
export { ingredientService };


