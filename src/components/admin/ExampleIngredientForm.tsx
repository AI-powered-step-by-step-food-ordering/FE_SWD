'use client';

import { useState } from 'react';
import CloudinaryImageUpload from '@/components/shared/CloudinaryImageUpload';

// Example: Using CloudinaryImageUpload in a form
export default function ExampleIngredientForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: 0,
  });

  const handleImageChange = (url: string) => {
    setFormData((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleImageDelete = () => {
    console.log('Image deleted from Cloudinary');
    // You can add additional cleanup logic here
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Submit form data to your backend
    console.log('Form data:', formData);
    
    try {
      // Example: POST to your API
      // const response = await fetch('/api/ingredients/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Add New Ingredient</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        {/* Image Upload */}
        <CloudinaryImageUpload
          value={formData.imageUrl}
          onChange={handleImageChange}
          onDelete={handleImageDelete}
          folder="healthy-food/ingredients"
          label="Ingredient Image"
          maxSizeMB={5}
          showPreview={true}
        />

        {/* Price field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Submit button */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Create Ingredient
          </button>
          <button
            type="button"
            onClick={() => setFormData({ name: '', description: '', imageUrl: '', price: 0 })}
            className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Debug: Show current form state */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Form Data:</h3>
        <pre className="text-xs text-gray-600 overflow-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
