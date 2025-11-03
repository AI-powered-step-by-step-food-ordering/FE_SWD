import apiClient from './api.config';
import { ApiResponse, Order, OrderRequest, UpdateOrderStatusRequest, PageRequest, PaginatedApiResponse } from '@/types/api.types';

class OrderService {
  /**
   * Get all orders with pagination, search, and sort
   */
  async getAll(params?: PageRequest): Promise<PaginatedApiResponse<Order>> {
    // Align with backend: /api/orders/getall?page=&size=&sortBy=&sortDir=
    let url = '/api/orders/getall';
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());

      // Map sort to sortBy/sortDir (accept "field,direction" or explicit fields)
      const anyParams = params as any;
      let sortBy: string | undefined;
      let sortDir: string | undefined;
      if (params.sort) {
        const [field, direction] = params.sort.split(',');
        sortBy = field;
        sortDir = direction || 'desc';
      } else if (anyParams.sortField || anyParams.sortDirection) {
        sortBy = anyParams.sortField;
        sortDir = anyParams.sortDirection;
      }
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortDir) queryParams.append('sortDir', sortDir);
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await apiClient.get<PaginatedApiResponse<Order>>(url);
    return response.data;
  }

  /**
   * Get all orders (legacy method for backward compatibility)
   */
  async getAllLegacy(): Promise<ApiResponse<Order[]>> {
    // Fetch a large page and flatten to a simple array for client-side filtering
    const params = new URLSearchParams({ page: '0', size: '1000' });
    const resp = await apiClient.get<PaginatedApiResponse<Order>>(`/api/orders/getall?${params.toString()}`);
    const page = resp.data?.data;
    const flat: Order[] = Array.isArray(page?.content) ? page!.content : [];
    return {
      success: resp.data?.success ?? true,
      code: resp.data?.code ?? 200,
      message: resp.data?.message ?? 'OK',
      data: flat,
      timestamp: resp.data?.timestamp ?? new Date().toISOString(),
    };
  }

  /**
   * Get order history by user ID
   */
  async getOrderHistory(userId: string): Promise<ApiResponse<Order[]>> {
    const response = await apiClient.get<ApiResponse<Order[]>>(`/api/orders/order-history/${userId}`);
    return response.data;
  }

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/getbyid/${id}`);
    return response.data;
  }

  /**
   * Create new order
   */
  async create(orderData: OrderRequest): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>(
      '/api/orders/create',
      orderData
    );
    return response.data;
  }

  /**
   * Update order
   */
  async update(id: string, orderData: OrderRequest): Promise<ApiResponse<Order>> {
    const response = await apiClient.put<ApiResponse<Order>>(
      `/api/orders/update/${id}`,
      orderData
    );
    return response.data;
  }

  /**
   * Delete order
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/orders/delete/${id}`
    );
    return response.data;
  }

  /**
   * Confirm order
   */
  async confirm(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>(
      `/api/orders/confirm/${id}`
    );
    return response.data;
  }

  /**
   * Complete order
   */
  async complete(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>(
      `/api/orders/complete/${id}`
    );
    return response.data;
  }

  /**
   * Cancel order
   */
  async cancel(id: string, reason?: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>(
      `/api/orders/cancel/${id}`,
      null,
      { params: { reason } }
    );
    return response.data;
  }

  /**
   * Apply promotion to order
   */
  async applyPromotion(id: string, promoCode: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>(
      `/api/orders/apply-promo/${id}`,
      { promoCode }
    );
    return response.data;
  }

  /**
   * Update order status with push notification
   */
  async updateStatus(id: string, statusData: UpdateOrderStatusRequest): Promise<ApiResponse<Order>> {
    const response = await apiClient.put<ApiResponse<Order>>(
      `/api/orders/${id}/status`,
      statusData
    );
    return response.data;
  }

  /**
   * Recalculate order totals
   */
  async recalculate(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>(`/api/orders/recalc/${id}`);
    return response.data;
  }
}

const orderService = new OrderService();
export default orderService;
export { orderService };


