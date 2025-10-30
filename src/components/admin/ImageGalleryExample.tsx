'use client';

import { useState } from 'react';
import CloudinaryImageGallery from '@/components/shared/CloudinaryImageGallery';
import CloudinaryImageUpload from '@/components/shared/CloudinaryImageUpload';

// Example: Gallery page with upload functionality
export default function ImageGalleryExample() {
  const [images, setImages] = useState([
    {
      id: '1',
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      name: 'Sample Image 1',
      description: 'This is a sample image',
    },
    {
      id: '2',
      url: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
      name: 'Sample Image 2',
      description: 'Another sample image',
    },
  ]);

  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const handleAddImage = () => {
    if (!newImageUrl) return;

    const newImage = {
      id: Date.now().toString(),
      url: newImageUrl,
      name: `Image ${images.length + 1}`,
      description: 'Uploaded via Cloudinary',
    };

    setImages((prev) => [...prev, newImage]);
    setNewImageUrl('');
    alert('Image added to gallery!');
  };

  const handleDeleteImage = (id: string, url: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    console.log('Deleted image:', { id, url });
  };

  const handleImageClick = (image: any) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-2">Image Gallery</h1>
        <p className="text-gray-600">Upload and manage your images with Cloudinary</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Upload New Image</h2>
        
        <div className="space-y-4">
          <CloudinaryImageUpload
            value={newImageUrl}
            onChange={setNewImageUrl}
            folder="healthy-food/gallery"
            label="Select Image"
            showPreview={true}
          />

          {newImageUrl && (
            <button
              onClick={handleAddImage}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Add to Gallery
            </button>
          )}
        </div>
      </div>

      {/* Gallery Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Gallery ({images.length} {images.length === 1 ? 'image' : 'images'})
          </h2>
          
          {images.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Delete all images?')) {
                  setImages([]);
                }
              }}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <CloudinaryImageGallery
          images={images}
          onDelete={handleDeleteImage}
          onImageClick={handleImageClick}
          editable={true}
          columns={4}
          showNames={true}
        />
      </div>

      {/* Image Details Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedImage.name}</h3>
                  <p className="text-gray-600 mt-1">{selectedImage.description}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 break-all">
                  <strong>URL:</strong> {selectedImage.url}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">📝 Instructions</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Click &quot;Select Image&quot; to upload a new image to Cloudinary</li>
          <li>• After upload, click &quot;Add to Gallery&quot; to add it to the gallery</li>
          <li>• Hover over images to see the delete button (trash icon)</li>
          <li>• Click on any image to view it in full size</li>
          <li>• Images are stored on Cloudinary&apos;s cloud storage</li>
        </ul>
      </div>
    </div>
  );
}
