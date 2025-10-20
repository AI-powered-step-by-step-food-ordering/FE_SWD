'use client';

import { useState } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { toast } from 'react-toastify';

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodItem {
  id: string;
  name: string;
  price: number;
  nutrition: NutritionInfo;
  image: string;
  description: string;
}

interface ReviewSectionProps {
  selectedItems: {
    starch?: FoodItem;
    protein?: FoodItem;
    vegetables?: FoodItem;
    sauce?: FoodItem;
  };
  totalPrice: number;
  totalNutrition: NutritionInfo;
}

export default function ReviewSection({ selectedItems, totalPrice, totalNutrition }: ReviewSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showLoading, hideLoading, navigateWithLoading } = usePageLoading();

  const handleSubmitOrder = async () => {
    // Prevent double submission with early return
    if (isSubmitting) {
      console.log('Already submitting, ignoring click');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Show toast immediately for better UX
      toast.info('🔄 Creating your order...', {
        position: "top-right",
        autoClose: 1500,
      });

      // Shorter delay for better perceived performance
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Save order to history
      const newOrder = {
        id: `ORD-${Date.now()}`,
        date: new Date().toISOString(),
        items: selectedItems,
        totalPrice,
        totalNutrition,
        goal: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).goal || 'maintenance' : 'maintenance',
        status: 'preparing' as const,
        deliveryTime: '20-25 mins'
      };
      
      const existingOrders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
      const updatedOrders = [newOrder, ...existingOrders];
      localStorage.setItem('orderHistory', JSON.stringify(updatedOrders));
      
      // Show success toast
      toast.success('✅ Order created! Going to checkout...', {
        position: "top-right",
        autoClose: 1200,
      });
      
      // Use the original loading system but with optimized timing
      setTimeout(() => {
        navigateWithLoading(`/checkout?orderId=${newOrder.id}`);
      }, 600);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      setIsSubmitting(false);
      
      // Show error toast
      toast.error('❌ Failed to create order. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Bowl</h2>
      <div className="space-y-4 mb-6">
        {Object.entries(selectedItems).map(([category, item]) => (
          item && (
            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{item.image}</span>
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">{category}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">₹{item.price}</div>
                <div className="text-sm text-gray-600">{item.nutrition.calories} kcal</div>
              </div>
            </div>
          )
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <div className="text-right">
            <div className="text-green-600">₹{totalPrice}</div>
            <div className="text-sm text-gray-600">{totalNutrition.calories} kcal</div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleSubmitOrder}
        disabled={isSubmitting}
        className={`w-full mt-6 py-3 rounded-xl font-bold transition-all duration-200 relative overflow-hidden ${
          isSubmitting 
            ? 'bg-green-500 cursor-not-allowed text-white' 
            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0'
        }`}
        style={{ 
          pointerEvents: isSubmitting ? 'none' : 'auto' // Completely disable pointer events when submitting
        }}
      >
        {isSubmitting && (
          <div className="absolute inset-0 bg-green-400 animate-pulse"></div>
        )}
        <div className="relative flex items-center justify-center space-x-2">
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Creating Order...</span>
            </>
          ) : (
            <span>🛒 Proceed to Checkout</span>
          )}
        </div>
      </button>
    </div>
  );
}

