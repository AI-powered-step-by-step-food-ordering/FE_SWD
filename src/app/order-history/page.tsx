'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';

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

interface Order {
  id: string;
  date: string;
  items: {
    starch?: FoodItem;
    protein?: FoodItem;
    vegetables?: FoodItem;
    sauce?: FoodItem;
  };
  totalPrice: number;
  totalNutrition: NutritionInfo;
  goal: string;
  status: 'completed' | 'preparing' | 'delivered';
  deliveryTime?: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Sample order data
  const sampleOrders: Order[] = [
    {
      id: 'ORD-001',
      date: '2024-01-20T12:30:00Z',
      items: {
        starch: { id: 'brown-rice', name: 'Brown Rice', price: 25, nutrition: { calories: 150, protein: 3, carbs: 30, fat: 1 }, image: '🍚', description: 'Whole grain, fiber-rich' },
        protein: { id: 'grilled-chicken', name: 'Grilled Chicken', price: 60, nutrition: { calories: 200, protein: 35, carbs: 0, fat: 6 }, image: '🍗', description: 'Lean, high-protein' },
        vegetables: { id: 'broccoli', name: 'Steamed Broccoli', price: 20, nutrition: { calories: 35, protein: 3, carbs: 7, fat: 0 }, image: '🥦', description: 'Vitamin C powerhouse' },
        sauce: { id: 'tahini', name: 'Tahini Dressing', price: 15, nutrition: { calories: 80, protein: 3, carbs: 3, fat: 7 }, image: '🥜', description: 'Creamy sesame flavor' }
      },
      totalPrice: 120,
      totalNutrition: { calories: 465, protein: 44, carbs: 40, fat: 14 },
      goal: 'muscle-gain',
      status: 'delivered',
      deliveryTime: '25 mins'
    },
    {
      id: 'ORD-002',
      date: '2024-01-19T13:15:00Z',
      items: {
        starch: { id: 'quinoa', name: 'Quinoa', price: 35, nutrition: { calories: 180, protein: 6, carbs: 32, fat: 2 }, image: '🌾', description: 'Complete protein, gluten-free' },
        protein: { id: 'tofu', name: 'Grilled Tofu', price: 45, nutrition: { calories: 150, protein: 15, carbs: 5, fat: 8 }, image: '🧈', description: 'Plant-based protein' },
        vegetables: { id: 'spinach', name: 'Sautéed Spinach', price: 18, nutrition: { calories: 25, protein: 3, carbs: 4, fat: 0 }, image: '🥬', description: 'Iron-rich leafy green' },
        sauce: { id: 'avocado', name: 'Avocado Cream', price: 20, nutrition: { calories: 100, protein: 2, carbs: 4, fat: 9 }, image: '🥑', description: 'Healthy fats' }
      },
      totalPrice: 118,
      totalNutrition: { calories: 455, protein: 26, carbs: 45, fat: 19 },
      goal: 'slim-fit',
      status: 'delivered',
      deliveryTime: '22 mins'
    },
    {
      id: 'ORD-003',
      date: '2024-01-18T12:00:00Z',
      items: {
        starch: { id: 'cauliflower-rice', name: 'Cauliflower Rice', price: 28, nutrition: { calories: 40, protein: 3, carbs: 8, fat: 0 }, image: '🥬', description: 'Low-carb alternative' },
        protein: { id: 'salmon', name: 'Grilled Salmon', price: 80, nutrition: { calories: 250, protein: 30, carbs: 0, fat: 12 }, image: '🐟', description: 'Omega-3 rich' },
        vegetables: { id: 'bell-peppers', name: 'Roasted Bell Peppers', price: 22, nutrition: { calories: 30, protein: 1, carbs: 7, fat: 0 }, image: '🫑', description: 'Colorful antioxidants' },
        sauce: { id: 'yogurt', name: 'Greek Yogurt Sauce', price: 12, nutrition: { calories: 40, protein: 4, carbs: 3, fat: 2 }, image: '🥛', description: 'Probiotic-rich' }
      },
      totalPrice: 142,
      totalNutrition: { calories: 360, protein: 38, carbs: 18, fat: 14 },
      goal: 'fat-loss',
      status: 'delivered',
      deliveryTime: '18 mins'
    }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const isAuth = localStorage.getItem('isAuthenticated');
    
    if (!isAuth || !userData) {
      router.push('/auth/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Load order history from localStorage or use sample data
    const savedOrders = localStorage.getItem('orderHistory');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      // Use sample data for demo
      setOrders(sampleOrders);
      localStorage.setItem('orderHistory', JSON.stringify(sampleOrders));
    }
    
    setIsLoading(false);
  }, [router]);

  const handleReorder = (order: Order) => {
    // Store the order items for reordering
    localStorage.setItem('reorderItems', JSON.stringify({
      selectedItems: order.items,
      selectedGoal: order.goal
    }));
    
    // Redirect to order page with reorder flag
    router.push('/order?reorder=true');
  };

  const getGoalEmoji = (goal: string) => {
    switch (goal) {
      case 'slim-fit': return '🏃‍♀️';
      case 'muscle-gain': return '💪';
      case 'fat-loss': return '🔥';
      default: return '⚖️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'preparing': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">Your past orders and quick reorder options</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{orders.reduce((sum, order) => sum + order.totalPrice, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(orders.reduce((sum, order) => sum + (order.deliveryTime ? parseInt(order.deliveryTime) : 20), 0) / orders.length)} min
                </p>
                <p className="text-sm text-gray-600">Avg Delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <span className="text-6xl mb-4 block">🥗</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
              <p className="text-gray-600 mb-6">Start building your first healthy bowl!</p>
              <button
                onClick={() => router.push('/order')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Build Your First Bowl
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{formatDate(order.date)}</p>
                      {order.deliveryTime && (
                        <p className="text-xs text-gray-500">Delivered in {order.deliveryTime}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span>{getGoalEmoji(order.goal)}</span>
                      <span>{order.goal.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>💰</span>
                      <span>₹{order.totalPrice}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>🔥</span>
                      <span>{order.totalNutrition.calories} kcal</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {Object.entries(order.items).map(([category, item]) => (
                      item && (
                        <div key={category} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{item.image}</span>
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-600 capitalize">{category}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            ₹{item.price} • {item.nutrition.calories} kcal
                          </div>
                        </div>
                      )
                    ))}
                  </div>

                  {/* Nutrition Summary */}
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-green-800 mb-2">Nutrition Summary</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-green-700">{order.totalNutrition.calories}</p>
                        <p className="text-green-600">Calories</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-700">{order.totalNutrition.protein}g</p>
                        <p className="text-green-600">Protein</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-700">{order.totalNutrition.carbs}g</p>
                        <p className="text-green-600">Carbs</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-700">{order.totalNutrition.fat}g</p>
                        <p className="text-green-600">Fat</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      ⚡ Reorder
                    </button>
                    <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                      📋 View Details
                    </button>
                    <button className="bg-blue-100 text-blue-700 py-2 px-4 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                      ⭐ Rate Order
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/order')}
              className="p-4 border-2 border-green-200 rounded-lg hover:border-green-300 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🥗</span>
                <div>
                  <p className="font-medium text-gray-900">Build New Bowl</p>
                  <p className="text-sm text-gray-600">Create a fresh personalized meal</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-gray-900">Nutrition Insights</p>
                  <p className="text-sm text-gray-600">View your eating patterns</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
