'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orderService, bowlService, paymentService } from '@/services';
import { Order, Bowl, PaymentTransaction } from '@/types/api.types';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      const [orderRes, paymentsRes] = await Promise.all([
        orderService.getById(orderId),
        paymentService.getByOrderId(orderId)
      ]);

      if (orderRes.success) {
        setOrder(orderRes.data);
        // Load bowls for this order
        await loadBowls(orderRes.data.id);
      }
      if (paymentsRes.success) {
        setPayments(paymentsRes.data);
      }
    } catch (err) {
      setError('Failed to load order data');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBowls = async (orderId: string) => {
    try {
      // In a real app, you'd have an endpoint to get bowls by order ID
      // For now, we'll simulate this
      const bowlsRes = await bowlService.getAll();
      if (bowlsRes.success) {
        // Filter bowls for this order (in real app, this would be done by the API)
        setBowls(bowlsRes.data.filter(bowl => bowl.orderId === orderId));
      }
    } catch (err) {
      console.error('Error loading bowls:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      const response = await orderService.cancel(order.id, 'Cancelled by user');
      if (response.success) {
        setOrder(response.data);
        alert('Order cancelled successfully');
      } else {
        alert('Failed to cancel order');
      }
    } catch (err) {
      alert('Failed to cancel order');
      console.error('Error cancelling order:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PREPARING':
        return 'Preparing';
      case 'READY':
        return 'Ready for Pickup';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const canCancelOrder = (status: string) => {
    return status === 'DRAFT' || status === 'CONFIRMED';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error || 'Order not found'}</p>
          <button 
            onClick={() => router.push('/order-history')}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Back to Order History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Tracking</h1>
          <p className="text-xl text-gray-600">Order #{order.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Order Details */}
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Status</h2>
              <div className="flex items-center justify-between">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
                {canCancelOrder(order.status) && (
                  <button
                    onClick={handleCancelOrder}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{getStatusText(order.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pickup Time:</span>
                  <span className="font-medium">
                    {order.pickupAt ? new Date(order.pickupAt).toLocaleString() : 'ASAP'}
                  </span>
                </div>
                {order.note && (
                  <div>
                    <span className="text-gray-600">Note:</span>
                    <p className="text-sm text-gray-800 mt-1">{order.note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bowls */}
            {bowls.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Bowls</h2>
                <div className="space-y-4">
                  {bowls.map((bowl) => (
                    <div key={bowl.id} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900">{bowl.name}</h3>
                      {bowl.instruction && (
                        <p className="text-sm text-gray-600 mt-1">Note: {bowl.instruction}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">Price: ${bowl.linePrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Payment & Summary */}
          <div className="space-y-6">
            {/* Payment Information */}
            {payments.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Information</h2>
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Payment #{payment.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">Method: {payment.method}</p>
                          <p className="text-sm text-gray-600">Status: {payment.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ${payment.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${order.subtotalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Promotion:</span>
                  <span className="font-medium text-green-600">-${order.promotionTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/order-history')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Order History
                </button>
                <button
                  onClick={() => router.push('/menu')}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Order Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




