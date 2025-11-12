import apiClient from './api.config';
import { ApiResponse, Order, OrderRequest, UpdateOrderStatusRequest, PagedResponse } from '@/types/api.types';

class OrderService {
  /**
   * Get all orders
   */
  async getAll(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc'; search?: string; status?: string }): Promise<ApiResponse<PagedResponse<Order>>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<Order>>>('/api/orders/getall', { params });
    return response.data;
  }

  /**
   * Get order history by user ID
   */
  async getOrderHistory(userId: string, params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<Order>>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<Order>>>(`/api/orders/order-history/${userId}` , { params });
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
      null,
      { params: { code: promoCode } }
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


