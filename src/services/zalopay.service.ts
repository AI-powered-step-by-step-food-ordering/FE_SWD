import apiClient from './api.config';
import { ApiResponse } from '@/types/api.types';

// Minimal ZaloPay DTOs based on backend docs provided
export interface ZaloPayCreateOrderRequest {
  orderId: string; // UUID from backend order
  amount: number;
  description?: string;
  bankCode?: string;
}

export interface ZaloPayCreateOrderResponse {
  returnCode: number;
  returnMessage: string;
  orderUrl: string;
  zpTransToken: string;
  appTransId: string;
  paymentTransactionId: string; // UUID
  amount: number;
}

class ZaloPayService {
  async createOrder(payload: ZaloPayCreateOrderRequest): Promise<ApiResponse<ZaloPayCreateOrderResponse>> {
    const response = await apiClient.post<ApiResponse<ZaloPayCreateOrderResponse>>('/api/zalopay/create-order', payload);
    const body = response.data as unknown as ApiResponse<any>;

    // Normalize potential snake_case keys from backend
    const d = body?.data || {};
    const normalized: ZaloPayCreateOrderResponse = {
      returnCode: d.returnCode ?? d.return_code ?? 0,
      returnMessage: d.returnMessage ?? d.return_message ?? '',
      orderUrl: d.orderUrl ?? d.order_url ?? d.orderurl ?? '',
      zpTransToken: d.zpTransToken ?? d.zp_trans_token ?? d.zp_transtoken ?? '',
      appTransId: d.appTransId ?? d.app_trans_id ?? d.apptransid ?? '',
      paymentTransactionId: d.paymentTransactionId ?? d.payment_transaction_id ?? d.paymenttransactionid ?? '',
      amount: d.amount ?? 0,
    };

    return { ...body, data: normalized } as unknown as ApiResponse<ZaloPayCreateOrderResponse>;
  }

  async query(appTransId: string): Promise<ApiResponse<string>> {
    const response = await apiClient.get<ApiResponse<string>>(`/api/zalopay/query/${encodeURIComponent(appTransId)}`);
    return response.data;
  }

  async updateStatus(paymentTransactionId: string, forceStatus?: 1 | 2): Promise<ApiResponse<string>> {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/zalopay/update-status/${encodeURIComponent(paymentTransactionId)}`,
      {},
      { params: { forceStatus } }
    );
    return response.data;
  }

  async refund(paymentTransactionId: string, amount: number, description?: string): Promise<ApiResponse<string>> {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/zalopay/refund/${encodeURIComponent(paymentTransactionId)}`,
      {},
      { params: { amount, description } }
    );
    return response.data;
  }
}

const zaloPayService = new ZaloPayService();
export default zaloPayService;
export { zaloPayService };


