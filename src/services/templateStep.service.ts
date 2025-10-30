import apiClient from './api.config';
import { ApiResponse, TemplateStep, TemplateStepRequest } from '@/types/api.types';

class TemplateStepService {
  /**
   * Get all template steps
   */
  async getAll(): Promise<ApiResponse<TemplateStep[]>> {
    const response = await apiClient.get<ApiResponse<TemplateStep[]>>('/api/template_steps/getall');
    return response.data;
  }

  /**
   * Get template steps by template ID
   */
  async getByTemplateId(templateId: string): Promise<ApiResponse<TemplateStep[]>> {
    const response = await apiClient.get<ApiResponse<TemplateStep[]>>(
      `/api/template_steps/getall?templateId=${templateId}`
    );
    return response.data;
  }

  /**
   * Get template step by ID
   */
  async getById(id: string): Promise<ApiResponse<TemplateStep>> {
    const response = await apiClient.get<ApiResponse<TemplateStep>>(`/api/template_steps/getbyid/${id}`);
    return response.data;
  }

  /**
   * Create new template step (Admin only)
   */
  async create(templateStepData: TemplateStepRequest): Promise<ApiResponse<TemplateStep>> {
    const response = await apiClient.post<ApiResponse<TemplateStep>>(
      '/api/template_steps/create',
      templateStepData
    );
    return response.data;
  }

  /**
   * Update template step (Admin only)
   */
  async update(id: string, templateStepData: TemplateStepRequest): Promise<ApiResponse<TemplateStep>> {
    const response = await apiClient.put<ApiResponse<TemplateStep>>(
      `/api/template_steps/update/${id}`,
      templateStepData
    );
    return response.data;
  }

  /**
   * Delete template step (Admin only)
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/template_steps/delete/${id}`
    );
    return response.data;
  }

  /**
   * Get template steps by category ID
   */
  async getByCategoryId(categoryId: string): Promise<ApiResponse<TemplateStep[]>> {
    const response = await apiClient.get<ApiResponse<TemplateStep[]>>(
      `/api/template_steps/getall?categoryId=${categoryId}`
    );
    return response.data;
  }
}

const templateStepService = new TemplateStepService();
export default templateStepService;
export { templateStepService };





