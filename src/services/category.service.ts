import apiClient from './api.config';
import { ApiResponse, Category, CategoryRequest, PagedResponse } from '@/types/api.types';

class CategoryService {
  /**
   * Get all categories
   */
  async getAll(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc'; sort?: string }): Promise<ApiResponse<PagedResponse<Category>>> {
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
    
    const response = await apiClient.get<ApiResponse<any>>(`/api/categories/getall?${searchParams.toString()}`);
    const res = response.data as ApiResponse<any>;
    let content: any[] = [];
    if (Array.isArray(res.data)) {
      content = res.data;
    } else if (res?.data?.content && Array.isArray(res.data.content)) {
      content = res.data.content;
    }
    // Normalize active flag
    content = content.map((cat: any) => ({
      ...cat,
      isActive: typeof cat.isActive === 'boolean' ? cat.isActive : !!cat.active,
    }));
    const paged: PagedResponse<Category> = {
      content: content as Category[],
      page: res?.data?.page ?? 0,
      size: res?.data?.size ?? content.length,
      totalElements: res?.data?.totalElements ?? content.length,
      totalPages: res?.data?.totalPages ?? 1,
      first: res?.data?.first ?? true,
      last: res?.data?.last ?? true,
    };
    return { ...res, data: paged } as ApiResponse<PagedResponse<Category>>;
  }

  /**
   * Get all categories (legacy method for backward compatibility)
   */
  async getAllLegacy(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<any>>('/api/categories/getall');
    const res = response.data as ApiResponse<any>;
    let content: any[] = [];
    if (Array.isArray(res.data)) {
      content = res.data;
    } else if (res?.data?.content && Array.isArray(res.data.content)) {
      content = res.data.content;
    }
    // Normalize active flag
    content = content.map((cat: any) => ({
      ...cat,
      isActive: typeof cat.isActive === 'boolean' ? cat.isActive : !!cat.active,
    }));
    return { ...res, data: content } as ApiResponse<Category[]>;
  }

  /**
   * Search categories with server-side filtering, pagination, and sorting
   * Backend expects: name (not searchText)
   */
  async search(params?: { 
    searchText?: string;
    page?: number; 
    size?: number; 
    sortBy?: string; 
    sortDir?: 'asc' | 'desc' 
  }): Promise<ApiResponse<PagedResponse<Category>>> {
    const searchParams = new URLSearchParams();

    // Backend expects 'name' parameter, not 'searchText'
    if (params?.searchText) searchParams.append('name', params.searchText.trim());
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<ApiResponse<any>>(`/api/categories/search?${searchParams.toString()}`);
    const res = response.data as ApiResponse<any>;
    let content: any[] = [];
    if (Array.isArray(res.data)) {
      content = res.data;
    } else if (res?.data?.content && Array.isArray(res.data.content)) {
      content = res.data.content;
    }
    // Normalize active flag
    content = content.map((cat: any) => ({
      ...cat,
      isActive: typeof cat.isActive === 'boolean' ? cat.isActive : !!cat.active,
    }));
    const paged: PagedResponse<Category> = {
      content: content as Category[],
      page: res?.data?.page ?? 0,
      size: res?.data?.size ?? content.length,
      totalElements: res?.data?.totalElements ?? content.length,
      totalPages: res?.data?.totalPages ?? 1,
      first: res?.data?.first ?? true,
      last: res?.data?.last ?? true,
    };
    return { ...res, data: paged } as ApiResponse<PagedResponse<Category>>;
  }

  /**
   * Get active categories with pagination
   */
  async getActive(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<Category>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<ApiResponse<any>>(`/api/categories/active?${searchParams.toString()}`);
    const res = response.data as ApiResponse<any>;
    let content: any[] = [];
    if (Array.isArray(res.data)) {
      content = res.data;
    } else if (res?.data?.content && Array.isArray(res.data.content)) {
      content = res.data.content;
    }
    // Normalize active flag
    content = content.map((cat: any) => ({
      ...cat,
      isActive: typeof cat.isActive === 'boolean' ? cat.isActive : !!cat.active,
    }));
    const paged: PagedResponse<Category> = {
      content: content as Category[],
      page: res?.data?.page ?? 0,
      size: res?.data?.size ?? content.length,
      totalElements: res?.data?.totalElements ?? content.length,
      totalPages: res?.data?.totalPages ?? 1,
      first: res?.data?.first ?? true,
      last: res?.data?.last ?? true,
    };
    return { ...res, data: paged } as ApiResponse<PagedResponse<Category>>;
  }

  /**
   * Get inactive categories with pagination
   */
  async getInactiveCategories(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<Category>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<ApiResponse<any>>(`/api/categories/inactive?${searchParams.toString()}`);
    const res = response.data as ApiResponse<any>;
    let content: any[] = [];
    if (Array.isArray(res.data)) {
      content = res.data;
    } else if (res?.data?.content && Array.isArray(res.data.content)) {
      content = res.data.content;
    }
    // Normalize active flag
    content = content.map((cat: any) => ({
      ...cat,
      isActive: typeof cat.isActive === 'boolean' ? cat.isActive : !!cat.active,
    }));
    const paged: PagedResponse<Category> = {
      content: content as Category[],
      page: res?.data?.page ?? 0,
      size: res?.data?.size ?? content.length,
      totalElements: res?.data?.totalElements ?? content.length,
      totalPages: res?.data?.totalPages ?? 1,
      first: res?.data?.first ?? true,
      last: res?.data?.last ?? true,
    };
    return { ...res, data: paged } as ApiResponse<PagedResponse<Category>>;
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
   * Get inactive categories (Admin only) - Legacy method
   */
  async getInactive(): Promise<ApiResponse<Category[]>> {
    const response = await this.getAll();
    if (response.data) {
      const inactiveCategories = (response.data.content || []).filter((cat: Category) => cat.active === false);
      return {
        ...response,
        data: inactiveCategories
      };
    }
    return { ...response, data: [] };
  }

  /**
   * Get active categories only
   */
  async getActiveCategories(): Promise<Category[]> {
    const response = await this.getAll();
    if (response.data) {
      return (response.data.content || []).filter((cat: Category) => cat.active === true);
    }
    return [];
  }

  /**
   * Get categories by kind
   */
  async getCategoriesByKind(kind: string): Promise<Category[]> {
    const response = await this.getAll();
    if (response.data) {
      return (response.data.content || []).filter((cat: Category) => cat.kind === kind && cat.active === true);
    }
    return [];
  }
}

const categoryService = new CategoryService();
export default categoryService;
export { categoryService };


