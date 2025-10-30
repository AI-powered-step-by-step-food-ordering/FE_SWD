'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  orderService, 
  bowlService, 
  templateStepService, 
  categoryService, 
  ingredientService,
  bowlTemplateService
} from '@/services';
import { Order, Bowl, TemplateStep, Category, Ingredient, BowlItem } from '@/types/api.types';

export default function CustomizeBowlPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [templateSteps, setTemplateSteps] = useState<TemplateStep[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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
      const orderRes = await orderService.getById(orderId);
      
      if (orderRes.success) {
        setOrder(orderRes.data);
        await loadBowlData();
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Failed to load order data');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBowlData = async () => {
    try {
      const [categoriesRes, activeTemplates] = await Promise.all([
        categoryService.getAll(),
        bowlTemplateService.getActiveTemplates()
      ]);

      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
      setTemplates(activeTemplates);
    } catch (err) {
      console.error('Error loading bowl data:', err);
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    try {
      const ingredientsRes = await ingredientService.getByCategory(categoryId);
      setIngredients(ingredientsRes);
    } catch (err) {
      console.error('Error loading ingredients:', err);
    }
  };

  const handleCreateBowl = async (templateId: string) => {
    try {
      const bowlData = {
        name: 'Custom Bowl',
        instruction: '',
        orderId: orderId,
        templateId: templateId
      };

      const response = await bowlService.create(bowlData);
      if (response.success) {
        setBowls(prev => [...prev, response.data]);
        // Load template steps for this bowl
        const stepsRes = await templateStepService.getByTemplateId(templateId);
        if (stepsRes.success) {
          setTemplateSteps(stepsRes.data);
        }
      }
    } catch (err) {
      console.error('Error creating bowl:', err);
    }
  };

  const handleAddIngredient = async (bowlId: string, ingredient: Ingredient) => {
    try {
      const bowlItemData = {
        quantity: 100, // Default quantity
        unitPrice: ingredient.unitPrice,
        bowlId: bowlId,
        ingredientId: ingredient.id
      };

      const response = await bowlService.createItem(bowlItemData);
      if (response.success) {
        // Refresh bowl data or update local state
        console.log('Ingredient added:', response.data);
      }
    } catch (err) {
      console.error('Error adding ingredient:', err);
    }
  };

  const handleRecalculateOrder = async () => {
    try {
      const response = await orderService.recalculate(orderId);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (err) {
      console.error('Error recalculating order:', err);
    }
  };

  const handleProceedToCheckout = () => {
    router.push(`/checkout/${orderId}`);
  };

  const formatMoney = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '0.00';
    }
    try {
      return Number(value).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading order...</p>
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
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customize Your Bowl</h1>
          <p className="text-xl text-gray-600">Order #{order.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Bowl Templates */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Template</h2>
              <div className="space-y-4">
                {templates.length > 0 ? (
                  templates.map((tpl) => (
                    <div key={tpl.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h3 className="text-lg font-semibold">{tpl.name}</h3>
                      <p className="text-sm text-gray-600">{tpl.description}</p>
                      <button 
                        onClick={() => handleCreateBowl(tpl.id)}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Select Template
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No templates available</p>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column - Categories and Ingredients */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Ingredients</h2>
              
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <span className="font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                {selectedCategory ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {ingredients.map((ingredient) => (
                      <div key={ingredient.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{ingredient.name}</span>
                          <span className="text-sm text-gray-600 ml-2">${ingredient.unitPrice}/{ingredient.unit}</span>
                        </div>
                        <button 
                          onClick={() => handleAddIngredient(bowls[0]?.id || '', ingredient)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Select a category to view ingredients</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                  <p className="text-sm text-gray-600">Order ID: {order.id}</p>
                  <p className="text-sm text-gray-600">Status: {order.status}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Bowls</h3>
                  {bowls.length > 0 ? (
                    <div className="space-y-2">
                      {bowls.map((bowl) => (
                        <div key={bowl.id} className="border rounded-lg p-3">
                          <p className="font-medium">{bowl.name}</p>
                          <p className="text-sm text-gray-600">${formatMoney(bowl.linePrice as unknown as number)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No bowls added yet</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${formatMoney(order.subtotalAmount as unknown as number)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Promotion:</span>
                    <span>-${formatMoney(order.promotionTotal as unknown as number)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${formatMoney(order.totalAmount as unknown as number)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={handleRecalculateOrder}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    Recalculate
                  </button>
                  <button 
                    onClick={handleProceedToCheckout}
                    disabled={bowls.length === 0}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
