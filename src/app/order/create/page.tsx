'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderService, storeService, bowlTemplateService } from '@/services';
import { Order, Store, BowlTemplate } from '@/types/api.types';

export default function CreateOrderPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [templates, setTemplates] = useState<BowlTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    storeId: '',
    pickupAt: '',
    note: '',
    userId: '' // In real app, get from auth context
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [storesRes, templatesRes] = await Promise.all([
        storeService.getAll(),
        bowlTemplateService.getAll()
      ]);

      if (storesRes.success) {
        setStores(storesRes.data);
      }
      if (templatesRes.success) {
        setTemplates(templatesRes.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.storeId) {
      setError('Please select a store');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // In real app, get userId from auth context
      const orderData = {
        ...formData,
        userId: 'user-123' // Replace with actual user ID
      };

      const response = await orderService.create(orderData);
      
      if (response.success) {
        // Redirect to bowl customization page
        router.push(`/order/${response.data.id}/customize`);
      } else {
        setError('Failed to create order');
      }
    } catch (err) {
      setError('Failed to create order');
      console.error('Error creating order:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Order</h1>
            <p className="text-gray-600">Fill in the details to start your order</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Selection */}
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-2">
                Select Store *
              </label>
              <select
                id="storeId"
                name="storeId"
                value={formData.storeId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup Time */}
            <div>
              <label htmlFor="pickupAt" className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Time
              </label>
              <input
                type="datetime-local"
                id="pickupAt"
                name="pickupAt"
                value={formData.pickupAt}
                onChange={handleInputChange}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty for ASAP pickup
              </p>
            </div>

            {/* Special Instructions */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any special requests or notes for your order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Summary</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Store: {stores.find(s => s.id === formData.storeId)?.name || 'Not selected'}</p>
                <p>Pickup: {formData.pickupAt ? new Date(formData.pickupAt).toLocaleString() : 'ASAP'}</p>
                <p>Subtotal: $0.00</p>
                <p>Total: $0.00</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.storeId}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}






