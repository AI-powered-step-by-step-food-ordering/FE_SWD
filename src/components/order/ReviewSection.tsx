'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageLoading } from '@/hooks/usePageLoading';
import { toast } from 'react-toastify';
import { orderService, storeService } from '@/services';
import { getStoredUser } from '@/lib/auth-utils';

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
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const { showLoading, hideLoading, navigateWithLoading } = usePageLoading();
  const router = useRouter();

  // Load stores on component mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        const response = await storeService.getAll();
        if (response.success) {
          // Handle both PagedResponse and array formats
          const storesArray = Array.isArray(response.data) 
            ? response.data 
            : (response.data as any).content || [];
          setStores(storesArray);
          if (storesArray.length > 0) {
            setSelectedStore(storesArray[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading stores:', error);
      }
    };
    loadStores();
  }, []);

  const normalizeDateToISO = (value?: string) => {
    if (!value) return undefined;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return new Date(value + ':00Z').toISOString();
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + 'T00:00:00Z').toISOString();
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
      return new Date(value + 'Z').toISOString();
    }
    try {
      return new Date(value).toISOString();
    } catch (_) {
      return undefined;
    }
  };

  const handleSubmitOrder = async () => {
    // Prevent double submission with early return
    if (isSubmitting) {
      console.log('Already submitting, ignoring click');
      return;
    }

    if (!selectedStore) {
      toast.error('Please select a store');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Show toast immediately for better UX
      toast.info('🔄 Creating your order...', {
        position: "top-right",
        autoClose: 1500,
      });

      // Get user data
      const user = getStoredUser();
      if (!user) {
        throw new Error('User not found. Please login again.');
      }

      // Create order via API
      const orderData = {
        storeId: selectedStore,
        pickupAt: normalizeDateToISO(pickupTime),
        note: notes,
        userId: user.id || user.email
      };

      const response = await orderService.create(orderData);
      
      if (response.success) {
        // Show success toast
        toast.success('✅ Order created! Going to customization...', {
          position: "top-right",
          autoClose: 1200,
        });
        
        // Redirect to bowl customization
        setTimeout(() => {
          router.push(`/order/${response.data.id}/customize`);
        }, 600);
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
      
    } catch (error: any) {
      console.error('Error submitting order:', error);
      setIsSubmitting(false);
      
      // Show error toast
      toast.error(error?.response?.data?.message || '❌ Failed to create order. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Bowl</h2>
      
      {/* Order Details Form */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Store *
          </label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Choose a store</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} - {store.address}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pickup Time
          </label>
          <input
            type="datetime-local"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Leave empty for ASAP pickup
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special requests or notes for your order..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Selected Items */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Selected Items</h3>
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
            <span>🍽️ Create Order & Customize Bowl</span>
          )}
        </div>
      </button>
    </div>
  );
}

