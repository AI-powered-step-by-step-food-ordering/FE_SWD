import apiClient from './api.config';
import { ApiResponse, User, UserUpdateRequest, PageRequest, PaginatedApiResponse } from '@/types/api.types';

// Ensure backend LocalDate (yyyy-MM-dd) for dateOfBirth
function toLocalDateString(input?: string): string | undefined {
  if (!input) return undefined;
  // If already yyyy-MM-dd, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return undefined;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return undefined;
  }
}

function normalizeUserPayload(userData: UserUpdateRequest): UserUpdateRequest {
  const dto: UserUpdateRequest = { ...userData };
  if (userData.dateOfBirth) {
    const localDate = toLocalDateString(userData.dateOfBirth);
    if (localDate) dto.dateOfBirth = localDate;
  }
  return dto;
}

class UserService {
  /**
   * Get all users with pagination, search, and sort (Admin only)
   */
  async getAll(params?: PageRequest): Promise<PaginatedApiResponse<User>> {
    // Align with backend: use sortBy/sortDir
    const searchParams = new URLSearchParams();

    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());

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
    if (sortBy) searchParams.append('sortBy', sortBy);
    if (sortDir) searchParams.append('sortDir', sortDir);

    const response = await apiClient.get<PaginatedApiResponse<User>>(`/api/users/getall?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get all users (legacy method for backward compatibility)
   */
  async getAllLegacy(): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/api/users/getall');
    return response.data;
  }

  /**
   * Search users with server-side filtering, pagination, and sorting
   * Backend expects: fullName, email, phone (not searchText)
   */
  async search(params?: { 
    searchText?: string;
    page?: number; 
    size?: number; 
    sortBy?: string; 
    sortDir?: 'asc' | 'desc' 
  }): Promise<PaginatedApiResponse<User>> {
    const searchParams = new URLSearchParams();

    // Backend expects fullName, email, phone - we search across all fields
    if (params?.searchText) {
      const search = params.searchText.trim();
      searchParams.append('fullName', search);
      searchParams.append('email', search);
      searchParams.append('phone', search);
    }
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<PaginatedApiResponse<User>>(`/api/users/search?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get active users with pagination and sorting
   */
  async getActive(params?: PageRequest): Promise<PaginatedApiResponse<User>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());

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
    if (sortBy) searchParams.append('sortBy', sortBy);
    if (sortDir) searchParams.append('sortDir', sortDir);

    const response = await apiClient.get<PaginatedApiResponse<User>>(`/api/users/active?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(`/api/users/getbyid/${id}`);
    return response.data;
  }

  /**
   * Get user by email (backend accepts identifier in the same path)
   */
  async getByEmail(email: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(`/api/users/getbyid/${encodeURIComponent(email)}`);
    return response.data;
  }

  /**
   * Update user profile (only own profile)
   */
  async update(id: string, userData: UserUpdateRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(
      `/api/users/update/${id}`,
      normalizeUserPayload(userData)
    );
    return response.data;
  }

  /**
   * Update user by email (backend accepts identifier in the same path)
   */
  async updateByEmail(email: string, userData: UserUpdateRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(
      `/api/users/update/${encodeURIComponent(email)}`,
      normalizeUserPayload(userData)
    );
    return response.data;
  }

  /**
   * Get inactive users (Admin only)
   */
  async getInactive(params?: PageRequest): Promise<PaginatedApiResponse<User>> {
    // Support pagination and sorting on inactive users endpoint
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());

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
    if (sortBy) searchParams.append('sortBy', sortBy);
    if (sortDir) searchParams.append('sortDir', sortDir);

    const response = await apiClient.get<PaginatedApiResponse<User>>(`/api/users/inactive?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get user by ID for admin (includes deleted users)
   */
  async getByIdAdmin(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(`/api/users/admin/getbyid/${id}`);
    return response.data;
  }

  /**
   * Create new user (Admin only)
   */
  async create(userData: UserUpdateRequest & { password: string }): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>(
      '/api/users/create',
      { ...normalizeUserPayload(userData) }
    );
    return response.data;
  }

  /**
   * Restore soft-deleted user (Admin only)
   */
  async restore(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(`/api/users/restore/${id}`);
    return response.data;
  }

  /**
   * Soft delete user (Admin only)
   */
  async softDelete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.put<ApiResponse<Record<string, never>>>(`/api/users/soft-delete/${id}`);
    return response.data;
  }

  /**
   * Delete user (Admin only)
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(`/api/users/delete/${id}`);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/api/users/me');
      return response.data;
    } catch (error) {
      // If /me endpoint doesn't exist, try to get user from token
      console.log('getCurrentUser /me failed, trying alternative approach');
      throw error;
    }
  }

  /**
   * Update current user profile
   */
  async updateCurrentUser(userData: UserUpdateRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(
      '/api/users/me',
      normalizeUserPayload(userData)
    );
    return response.data;
  }
}

const userService = new UserService();
export default userService;
export { userService };
