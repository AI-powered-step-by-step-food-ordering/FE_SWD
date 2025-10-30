import apiClient from './api.config';
import { ApiResponse, PaymentTransaction, PaymentTransactionRequest } from '@/types/api.types';

class PaymentService {
  /**
   * Get all payment transactions
   */
  async getAll(): Promise<ApiResponse<PaymentTransaction[]>> {
    const response = await apiClient.get<ApiResponse<PaymentTransaction[]>>('/api/payment_transactions/getall');
    return response.data;
  }

  /**
   * Get payment transaction by ID
   */
  async getById(id: string): Promise<ApiResponse<PaymentTransaction>> {
    const response = await apiClient.get<ApiResponse<PaymentTransaction>>(`/api/payment_transactions/getbyid/${id}`);
    return response.data;
  }

  /**
   * Create new payment transaction
   */
  async create(paymentData: PaymentTransactionRequest): Promise<ApiResponse<PaymentTransaction>> {
    const response = await apiClient.post<ApiResponse<PaymentTransaction>>(
      '/api/payment_transactions/create',
      paymentData
    );
    return response.data;
  }

  /**
   * Update payment transaction
   */
  async update(id: string, paymentData: PaymentTransactionRequest): Promise<ApiResponse<PaymentTransaction>> {
    const response = await apiClient.put<ApiResponse<PaymentTransaction>>(
      `/api/payment_transactions/update/${id}`,
      paymentData
    );
    return response.data;
  }

  /**
   * Delete payment transaction
   */
  async delete(id: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/api/payment_transactions/delete/${id}`
    );
    return response.data;
  }

  /**
   * Get payment transactions by order ID
   */
  async getByOrderId(orderId: string): Promise<ApiResponse<PaymentTransaction[]>> {
    const response = await apiClient.get<ApiResponse<PaymentTransaction[]>>(
      `/api/payment_transactions/getbyorder/${orderId}`
    );
    return response.data;
  }

  /**
   * Process payment for an order
   */
  async processPayment(orderId: string, method: string, amount: number, providerTxnId?: string): Promise<ApiResponse<PaymentTransaction>> {
    const paymentData: PaymentTransactionRequest = {
      method,
      status: 'PENDING',
      amount,
      providerTxnId,
      orderId
    };
    return this.create(paymentData);
  }

  /**
   * Update payment status
   */
  async updateStatus(id: string, status: string): Promise<ApiResponse<PaymentTransaction>> {
    const response = await apiClient.put<ApiResponse<PaymentTransaction>>(
      `/api/payment_transactions/update-status/${id}`,
      { status }
    );
    return response.data;
  }
}

export default new PaymentService();




