'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import { usePageLoading } from '@/hooks/usePageLoading';
import { toast } from 'react-toastify';

interface Order {
  id: string;
  date: string;
  items: any;
  totalPrice: number;
  totalNutrition: any;
  goal: string;
  status: string;
  deliveryTime: string;
}

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showLoading, hideLoading, navigateWithLoading } = usePageLoading();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryAddress, setDeliveryAddress] = useState('office');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const loadCheckoutData = async () => {
      // Wait a bit for navigateWithLoading to complete its animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check authentication
      const userData = document.cookie.split(';').find(c => c.trim().startsWith('user='))?.split('=')[1];
      const isAuth = document.cookie.includes('isAuthenticated=true') ? 'true' : 'false';
      
      if (!isAuth || !userData) {
        hideLoading(); // Hide loading before redirect
        toast.error('🔒 Please login to access checkout.', {
          position: "top-right",
          autoClose: 2000,
        });
        navigateWithLoading('/auth/login');
        return;
      }
      
      setUser(JSON.parse(userData));

      // Load order details
      if (orderId) {
        const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        const currentOrder = orders.find((o: Order) => o.id === orderId);
        if (currentOrder) {
          setOrder(currentOrder);
        } else {
          hideLoading(); // Hide loading before redirect
          toast.error('❌ Order not found. Redirecting to order page.', {
            position: "top-right",
            autoClose: 2000,
          });
          navigateWithLoading('/order');
          return;
        }
      }
      
      // Hide the global loading and show page
      hideLoading();
      setIsPageLoading(false);
    };

    loadCheckoutData();
  }, [orderId, router, navigateWithLoading, hideLoading]);

  const handlePayment = async () => {
    if (!order) return;
    
    setIsProcessing(true);
    
    try {
      // Show processing animation for better UX
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      // Update order status
      const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
      const updatedOrders = orders.map((o: Order) => 
        o.id === order.id 
          ? { ...o, status: 'confirmed', paymentMethod, deliveryAddress }
          : o
      );
      localStorage.setItem('orderHistory', JSON.stringify(updatedOrders));
      
      // Show success toast with smooth transition
      toast.success('🎉 Payment successful! Order confirmed!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Smooth transition to success screen
      setTimeout(() => {
        setIsProcessing(false);
        setOrderPlaced(true);
      }, 800);
      
    } catch (error) {
      setIsProcessing(false);
      
      // Show error toast
      toast.error('❌ Payment failed! Please try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  if (isPageLoading || !order || !user) {
    return null; // Let the global loading from navigateWithLoading handle this
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in-0 zoom-in-95 duration-500">
          {/* Success Animation */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-50 duration-700 delay-200">
            <svg className="w-10 h-10 text-green-600 animate-in fade-in-0 duration-500 delay-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <div className="animate-in slide-in-from-bottom-4 duration-500 delay-300">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🎉 Order Confirmed!</h1>
            <p className="text-gray-600 mb-6">Your healthy bowl is being prepared with love</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 mb-6 animate-in slide-in-from-bottom-4 duration-500 delay-500">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-green-800">Order #{order.id}</span>
              <span className="text-green-600 font-bold">₹{order.totalPrice}</span>
            </div>
            <div className="text-sm text-green-700 flex items-center justify-center space-x-1">
              <span>⏰</span>
              <span>Estimated delivery: {order.deliveryTime}</span>
            </div>
          </div>

          <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500 delay-700">
            <button
              onClick={() => {
                toast.info('Redirecting to order history...', {
                  position: "top-right",
                  autoClose: 1500,
                });
                setTimeout(() => {
                  navigateWithLoading('/order-history');
                }, 800);
              }}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors transform hover:-translate-y-1 active:translate-y-0"
            >
              📋 View Order Status
            </button>
            
            <button
              onClick={() => {
                toast.success('🥗 Let\'s create another healthy bowl!', {
                  position: "top-right",
                  autoClose: 1500,
                });
                setTimeout(() => {
                  navigateWithLoading('/order');
                }, 800);
              }}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors transform hover:-translate-y-1 active:translate-y-0"
            >
              🥗 Order Another Bowl
            </button>
            
            <button
              onClick={() => {
                toast.info('🏠 Going back to home...', {
                  position: "top-right",
                  autoClose: 1500,
                });
                setTimeout(() => {
                  navigateWithLoading('/');
                }, 800);
              }}
              className="w-full text-green-600 py-2 font-medium hover:text-green-700 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-green-300">
                      <input
                        type="radio"
                        name="address"
                        value="office"
                        checked={deliveryAddress === 'office'}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="text-green-600"
                      />
                      <div>
                        <p className="font-medium">🏢 Office Address</p>
                        <p className="text-sm text-gray-600">123 Business District, Floor 5</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-green-300">
                      <input
                        type="radio"
                        name="address"
                        value="home"
                        checked={deliveryAddress === 'home'}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="text-green-600"
                      />
                      <div>
                        <p className="font-medium">🏠 Home Address</p>
                        <p className="text-sm text-gray-600">456 Residential Area, Apt 2B</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="e.g., Leave at reception, Call when arrived..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-green-300">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard, Rupay</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-green-300">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-medium">UPI Payment</p>
                      <p className="text-sm text-gray-600">PhonePe, GPay, Paytm</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-green-300">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💵</span>
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-gray-600">Pay when you receive</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-3 mb-6">
                {Object.entries(order.items).map(([category, item]: [string, any]) => (
                  item && (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{item.image}</span>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600 capitalize">{category}</p>
                        </div>
                      </div>
                      <span className="font-medium text-green-600">₹{item.price}</span>
                    </div>
                  )
                ))}
              </div>

              {/* Nutrition Info */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-800 mb-2">Nutrition Facts</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-green-700">{order.totalNutrition.calories}</p>
                    <p className="text-green-600">Calories</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-700">{order.totalNutrition.protein}g</p>
                    <p className="text-green-600">Protein</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{order.totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (5%)</span>
                  <span>₹{Math.round(order.totalPrice * 0.05)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-600">₹{Math.round(order.totalPrice * 1.05)}</span>
                </div>
              </div>

              {/* Estimated Delivery */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🚚</span>
                  <div>
                    <p className="font-medium text-blue-800">Estimated Delivery</p>
                    <p className="text-sm text-blue-600">{order.deliveryTime}</p>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg font-bold transition-all duration-300 relative overflow-hidden ${
                  isProcessing 
                    ? 'bg-green-500 cursor-not-allowed text-white' 
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0'
                }`}
              >
                {isProcessing && (
                  <div className="absolute inset-0 bg-green-400 animate-pulse"></div>
                )}
                <div className="relative flex items-center justify-center space-x-2">
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <span>🛒 Place Order - ₹{Math.round(order.totalPrice * 1.05)}</span>
                  )}
                </div>
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                By placing this order, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
