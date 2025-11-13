import apiClient from './api.config';
import { ApiResponse, Order, OrderRequest, UpdateOrderStatusRequest, PagedResponse } from '@/types/api.types';

class OrderService {
  /**
   * Get all orders
   */
  async getAll(params?: { page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<ApiResponse<PagedResponse<Order>>> {
    // Ensure params are always provided with defaults matching backend
    let queryParams: any = {
      page: params?.page ?? 0,
      size: params?.size ?? 5,
      sortBy: params?.sortBy ?? 'createdAt',
      sortDir: params?.sortDir ?? 'desc',
    };
    
    // Limit size to prevent backend overload (backend default is 5)
    if (queryParams.size > 100) {
      queryParams.size = 100;
      console.warn('OrderService.getAll: size reduced to 100 to prevent backend overload');
    }
    
    // Try with progressively smaller sizes if we get 500 errors
    const sizesToTry = [queryParams.size, 50, 20, 10, 5];
    
    for (const size of sizesToTry) {
      try {
        const currentParams = { ...queryParams, size };
        const response = await apiClient.get<ApiResponse<PagedResponse<Order>>>('/api/orders/getall', { params: currentParams });
        if (response.data && response.data.success !== false) {
          return response.data;
        }
      } catch (error: any) {
        // If 500 error and we have more sizes to try, continue to next size
        if (error?.response?.status === 500 && size > sizesToTry[sizesToTry.length - 1]) {
          console.warn(`OrderService.getAll: 500 error with size ${size}, trying smaller size`);
          continue;
        }
        // If last attempt or different error, return error response
        if (size === sizesToTry[sizesToTry.length - 1]) {
          console.error('OrderService.getAll: All retry attempts failed', error);
          // Return error response instead of throwing
          return {
            success: false,
            code: error?.response?.status || 500,
            message: error?.response?.data?.message || error?.message || 'Failed to load orders',
            timestamp: new Date().toISOString(),
            data: {
              content: [],
              page: queryParams.page,
              size: 0,
              totalElements: 0,
              totalPages: 0,
              first: true,
              last: true,
            } as PagedResponse<Order>,
          };
        }
      }
    }
    
    // Fallback: return empty response
    return {
      success: false,
      code: 500,
      message: 'Failed to load orders after multiple retry attempts',
      timestamp: new Date().toISOString(),
      data: {
        content: [],
        page: queryParams.page,
        size: 0,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      } as PagedResponse<Order>,
    };
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


