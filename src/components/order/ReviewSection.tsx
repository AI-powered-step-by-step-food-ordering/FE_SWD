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
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    showLoading();

    try {
      // Simulate API call to submit order
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      
      // Hide loading
      hideLoading();
      
      // Show success toast
      toast.success('🎉 Order placed successfully! Redirecting to checkout...', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Wait for toast, then redirect
      setTimeout(() => {
        navigateWithLoading(`/checkout?orderId=${newOrder.id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      
      // Hide loading
      hideLoading();
      setIsSubmitting(false);
      
      // Show error toast
      toast.error('❌ Failed to place order. Please try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
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
        className={`w-full mt-6 py-3 rounded-xl font-bold transition-all duration-300 ${
          isSubmitting 
            ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0'
        }`}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            <span>Processing Order...</span>
          </div>
        ) : (
          '🛒 Proceed to Checkout'
        )}
      </button>
    </div>
  );
}

