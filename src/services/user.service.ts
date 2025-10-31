import apiClient from './api.config';
import { ApiResponse, User, UserUpdateRequest } from '@/types/api.types';

class UserService {
  /**
   * Get all users (Admin only)
   */
  async getAll(): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/api/users/getall');
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
      userData
    );
    return response.data;
  }

  /**
   * Update user by email (backend accepts identifier in the same path)
   */
  async updateByEmail(email: string, userData: UserUpdateRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(
      `/api/users/update/${encodeURIComponent(email)}`,
      userData
    );
    return response.data;
  }

  /**
   * Get inactive users (Admin only)
   */
  async getInactive(): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/api/users/inactive');
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
      userData
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
      userData
    );
    return response.data;
  }
}

const userService = new UserService();
export default userService;
export { userService };
