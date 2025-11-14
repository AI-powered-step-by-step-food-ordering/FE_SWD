'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orderService, bowlService, paymentService } from '@/services';
import { Order, Bowl, PaymentTransaction } from '@/types/api.types';
import { formatVND } from '@/lib/format-number';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getFirebaseThumbnail } from '@/lib/firebase-storage';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const FETCH_PAYMENTS = false; // disable until payments endpoint is stable

  const loadOrderData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch order first (critical)
      const orderRes = await orderService.getById(orderId);
      if (orderRes.data) {
        setOrder(orderRes.data);
        await loadBowls(orderRes.data.id);
      } else {
        setError(orderRes.message || 'Failed to load order');
        setLoading(false);
        return;
      }

      // Optionally fetch payments; ignore failures
      if (FETCH_PAYMENTS) {
        try {
          const paymentsRes = await paymentService.getByOrderId(orderId);
          if (paymentsRes?.data) {
            setPayments(paymentsRes.data);
          }
        } catch (e) {
          /* silently ignore */
        }
      }
    } catch (err) {
      setError('Failed to load order data');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId, FETCH_PAYMENTS]);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId, loadOrderData]);

  const loadBowls = async (orderId: string) => {
    try {
      // Fetch bowls with items for this order
      const bowlsRes = await bowlService.getAll({ page: 0, size: 200 });
      if (bowlsRes.data) {
        const list = (bowlsRes.data?.content || []) as any[];
        const orderBowls = list.filter((bowl: any) => bowl.orderId === orderId);
        
        // Fetch items for each bowl
        const bowlsWithItems = await Promise.all(
          orderBowls.map(async (bowl: any) => {
            try {
              const bowlWithItems = await bowlService.getByIdWithItems(bowl.id);
              if (bowlWithItems.data) {
                return bowlWithItems.data;
              }
              return bowl;
            } catch (err) {
              console.error(`Error loading items for bowl ${bowl.id}:`, err);
              return bowl;
            }
          })
        );
        
        setBowls(bowlsWithItems);
      }
    } catch (err) {
      console.error('Error loading bowls:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <i className="bx bx-arrow-back text-2xl"></i>
            <span className="text-lg font-medium">Go back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Món ăn (Dishes with images) */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Món ăn</h2>
            {bowls.length > 0 ? (
              <div className="space-y-4">
                {bowls.map((bowl) => {
                  const hasItems = bowl.items && bowl.items.length > 0;
                  const templateImage = (bowl.template as any)?.imageUrl;
                  
                  return (
                    <div key={bowl.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
                      {/* Bowl Header with Image */}
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Bowl Image */}
                          <div className="flex-shrink-0">
                            {templateImage ? (
                              <ImageWithFallback
                                src={getFirebaseThumbnail(templateImage)}
                                alt={bowl.name || "Bowl"}
                                width={120}
                                height={120}
                                className="rounded-xl object-cover shadow-md"
                                fallbackSrc="/icon.svg"
                              />
                            ) : (
                              <div className="w-[120px] h-[120px] flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                                <i className="bx bx-bowl-rice text-gray-400 text-5xl"></i>
                              </div>
                            )}
                          </div>
                          
                          {/* Bowl Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{bowl.name}</h3>
                            {bowl.instruction && (
                              <p className="text-sm text-gray-600 mb-2">{bowl.instruction}</p>
                            )}
                            <p className="text-lg font-bold text-green-600">
                              {formatVND(bowl.linePrice ?? 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Items List with Images - Always visible */}
                      {hasItems && (
                        <div className="border-t-2 border-gray-200 bg-gray-50 p-4">
                          <h4 className="text-base font-bold text-gray-800 mb-3">Ingredients:</h4>
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {bowl.items?.map((item) => {
                              const ingredient = item.ingredient;
                              const standardQuantity = ingredient?.standardQuantity ?? 1;
                              const pricePerUnit = standardQuantity > 0 
                                ? (item.unitPrice ?? 0) / standardQuantity 
                                : (item.unitPrice ?? 0);
                              const itemSubtotal = standardQuantity > 0 
                                ? ((item.quantity || 0) / standardQuantity) * (item.unitPrice ?? 0)
                                : 0;
                              
                              return (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                  {/* Ingredient Image */}
                                  <div className="flex-shrink-0">
                                    {ingredient?.imageUrl ? (
                                      <ImageWithFallback
                                        src={getFirebaseThumbnail(ingredient.imageUrl)}
                                        alt={ingredient.name || "Ingredient"}
                                        width={64}
                                        height={64}
                                        className="rounded-lg object-cover"
                                        fallbackSrc="/icon.svg"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-gray-100">
                                        <i className="bx bx-food-menu text-gray-400 text-2xl"></i>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Ingredient Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      {ingredient?.name || `Ingredient ${item.ingredientId}`}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <span>{item.quantity} {ingredient?.unit || 'g'}</span>
                                      <span>×</span>
                                      <span>{formatVND(pricePerUnit)}/{ingredient?.unit || 'g'}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Item Subtotal */}
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-green-600">
                                      {formatVND(itemSubtotal)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <p className="text-gray-500">Chưa có món nào</p>
              </div>
            )}
          </div>

          {/* Right Column - Order Information & Total Price */}
          <div className="space-y-6 pt-12">
            {/* Order Information */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium text-sm break-all">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{getStatusText(order.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-sm">
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

            {/* Total Price */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-xl p-6 border-2 border-green-400">
              <h2 className="text-xl font-bold text-white mb-4">Giá tiền tổng</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-white/90">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatVND(order.subtotalAmount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-white/90">
                  <span>Promotion:</span>
                  <span className="font-semibold">-{formatVND(order.promotionTotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-white border-t-2 border-white/30 pt-3 mt-3">
                  <span>Total:</span>
                  <span>{formatVND(order.totalAmount ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {payments.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">Payment #{payment.id.slice(-8)}</p>
                          <p className="text-xs text-gray-600">Method: {payment.method}</p>
                          <p className="text-xs text-gray-600">Status: {payment.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-green-600">{formatVND(payment.amount ?? 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}





