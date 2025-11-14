import apiClient from './api.config';
import {
  ApiResponse,
  BowlTemplate,
  BowlTemplateRequest,
  TemplateStep,
  TemplateStepRequest,
  PagedResponse,
} from '@/types/api.types';

class BowlTemplateService {
  /**
   * Get all bowl templates
   */
  async getAll(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<BowlTemplate>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);
    
    const response = await apiClient.get<ApiResponse<PagedResponse<BowlTemplate>>>(`/api/bowl_templates/getall?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Search bowl templates with server-side filtering, pagination, and sorting
   * Backend expects: name (not searchText)
   */
  async search(params?: { 
    searchText?: string;
    page?: number; 
    size?: number; 
    sortBy?: string; 
    sortDir?: 'asc' | 'desc' 
  }): Promise<ApiResponse<PagedResponse<BowlTemplate>>> {
    const searchParams = new URLSearchParams();

    // Backend expects 'name' parameter, not 'searchText'
    if (params?.searchText) searchParams.append('name', params.searchText.trim());
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<BowlTemplate>>>(`/api/bowl_templates/search?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get active bowl templates with pagination
   */
  async getActive(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<BowlTemplate>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDir) searchParams.append('sortDir', params.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<BowlTemplate>>>(`/api/bowl_templates/active?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get bowl template by ID
   */
  async getById(id: string): Promise<ApiResponse<BowlTemplate>> {
    const response = await apiClient.get<ApiResponse<BowlTemplate>>(
      `/api/bowl_templates/getbyid/${id}`
    );
    return response.data;
  }

  /**
   * Create new bowl template (Admin only)
   */
  async create(templateData: BowlTemplateRequest): Promise<ApiResponse<BowlTemplate>> {
    const response = await apiClient.post<ApiResponse<BowlTemplate>>(
      '/api/bowl_templates/create',
      templateData
    );
    return response.data;
  }

  /**
   * Update bowl template (Admin only)
   */
  async update(
    id: string,
    templateData: BowlTemplateRequest
  ): Promise<ApiResponse<BowlTemplate>> {
    const response = await apiClient.put<ApiResponse<BowlTemplate>>(
      `/api/bowl_templates/update/${id}`,
      templateData
    );
    return response.data;
  }

  /**
   * Delete bowl template (Admin only)
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/bowl_templates/delete/${id}`
    );
    return response.data;
  }

  /**
   * Soft delete bowl template (Admin only)
   */
  async softDelete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.put<ApiResponse<Record<string, never>>>(
      `/api/bowl_templates/soft-delete/${id}`
    );
    return response.data;
  }

  /**
   * Restore soft-deleted bowl template (Admin only)
   */
  async restore(id: string): Promise<ApiResponse<BowlTemplate>> {
    const response = await apiClient.put<ApiResponse<BowlTemplate>>(
      `/api/bowl_templates/restore/${id}`
    );
    return response.data;
  }

  /**
   * Get active templates only
   */
  async getActiveTemplates(): Promise<BowlTemplate[]> {
    const response = await this.getAll({ page: 0, size: 100 });
    const content = response.data?.content ?? [];
    return content.filter((template) => template.active === true);
  }

  /**
   * Get inactive templates only
   */
  async getInactiveTemplates(): Promise<ApiResponse<BowlTemplate[] | PagedResponse<BowlTemplate>>> {
    const response = await apiClient.get<ApiResponse<BowlTemplate[] | PagedResponse<BowlTemplate>>>(
      '/api/bowl_templates/inactive'
    );
    return response.data;
  }

  // Template Steps Methods
  /**
   * Get all template steps
   */
  async getAllSteps(): Promise<ApiResponse<TemplateStep[]>> {
    const response = await apiClient.get<ApiResponse<TemplateStep[]>>(
      '/api/template_steps/getall'
    );
    return response.data;
  }

  /**
   * Get template step by ID
   */
  async getStepById(id: string): Promise<ApiResponse<TemplateStep>> {
    const response = await apiClient.get<ApiResponse<TemplateStep>>(
      `/api/template_steps/getbyid/${id}`
    );
    return response.data;
  }

  /**
   * Create new template step (Admin only)
   */
  async createStep(stepData: TemplateStepRequest): Promise<ApiResponse<TemplateStep>> {
    const response = await apiClient.post<ApiResponse<TemplateStep>>(
      '/api/template_steps/create',
      stepData
    );
    return response.data;
  }

  /**
   * Update template step (Admin only)
   */
  async updateStep(id: string, stepData: TemplateStepRequest): Promise<ApiResponse<TemplateStep>> {
    const response = await apiClient.put<ApiResponse<TemplateStep>>(
      `/api/template_steps/update/${id}`,
      stepData
    );
    return response.data;
  }

  /**
   * Delete template step (Admin only)
   */
  async deleteStep(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/template_steps/delete/${id}`
    );
    return response.data;
  }

  /**
   * Get steps for a specific template
   */
  async getStepsByTemplate(templateId: string): Promise<TemplateStep[]> {
    const response = await this.getAllSteps();
    if (response.success && response.data) {
      return response.data
        .filter((step) => step.templateId === templateId)
        .sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return [];
  }
}

const bowlTemplateService = new BowlTemplateService();
export default bowlTemplateService;
export { bowlTemplateService };


