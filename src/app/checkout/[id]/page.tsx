'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orderService, paymentService, promotionService } from '@/services';
import { Order, Promotion } from '@/types/api.types';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [promoCode, setPromoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const loadOrderData = useCallback(async () => {
    try {
      setLoading(true);
      const [orderRes, promotionsRes] = await Promise.all([
        orderService.getById(orderId),
        promotionService.getActivePromotions()
      ]);

      if (orderRes.success) {
        setOrder(orderRes.data);
      }
      if (promotionsRes) {
        setPromotions(promotionsRes);
      }
    } catch (err) {
      setError('Failed to load order data');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId, loadOrderData]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    try {
      const response = await orderService.applyPromotion(orderId, promoCode);
      if (response.success) {
        setOrder(response.data);
        setSuccess('Promotion applied successfully!');
        setPromoCode('');
      } else {
        setError('Invalid promotion code');
      }
    } catch (err) {
      setError('Failed to apply promotion');
      console.error('Error applying promotion:', err);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    try {
      setSubmitting(true);
      setError('');

      // Create payment transaction
      const paymentData = {
        method: paymentMethod,
        status: 'PENDING',
        amount: order.totalAmount,
        providerTxnId: `stripe_${Date.now()}`, // In real app, integrate with payment gateway
        orderId: orderId
      };

      const paymentResponse = await paymentService.create(paymentData);
      
      if (paymentResponse.success) {
        // Simulate payment processing
        setTimeout(async () => {
          try {
            // Update payment status to completed
            await paymentService.updateStatus(paymentResponse.data.id, 'COMPLETED');
            
            // Confirm order
            const confirmResponse = await orderService.confirm(orderId);
            if (confirmResponse.success) {
              setOrder(confirmResponse.data);
              setSuccess('Payment successful! Your order has been confirmed.');
              
              // Redirect to order tracking after 2 seconds
              setTimeout(() => {
                router.push(`/order-history/${orderId}`);
              }, 2000);
            }
          } catch (err) {
            setError('Payment processing failed');
            console.error('Error processing payment:', err);
          }
        }, 2000);
      } else {
        setError('Payment failed');
      }
    } catch (err) {
      setError('Payment failed');
      console.error('Error processing payment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('card')) {
      setCardDetails(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      if (name === 'paymentMethod') {
        setPaymentMethod(value);
      }
    }
  };

  const formatMoney = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '0.00';
    try { return Number(value).toFixed(2); } catch { return '0.00'; }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-xl text-gray-600">Complete your order</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Payment Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>

            {/* Promotion Code */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={paymentMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CASH">Cash</option>
                <option value="E_WALLET">E-Wallet</option>
              </select>
            </div>

            {/* Card Details */}
            {paymentMethod === 'CREDIT_CARD' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={cardDetails.cardholderName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={submitting || order.status !== 'DRAFT'}
              className="w-full mt-6 px-6 py-3 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Processing Payment...' : `Pay $${formatMoney(order.totalAmount as unknown as number)}`}
            </button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-600">Order ID: {order.id}</p>
                <p className="text-sm text-gray-600">Status: {order.status}</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>${formatMoney(order.subtotalAmount as unknown as number)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Promotion:</span>
                  <span className="text-green-600">-${formatMoney(order.promotionTotal as unknown as number)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${formatMoney(order.totalAmount as unknown as number)}</span>
                </div>
              </div>

              {promotions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Promotions</h3>
                  <div className="space-y-2">
                    {promotions.slice(0, 3).map((promo) => (
                      <div key={promo.id} className="text-sm text-gray-600">
                        <span className="font-medium">{promo.code}</span> - {promo.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

