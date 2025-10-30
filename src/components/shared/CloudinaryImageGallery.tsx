'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  deleteFromCloudinary,
  extractPublicId,
  getCloudinaryThumbnail,
} from '@/lib/cloudinary';

interface ImageGalleryItem {
  id: string;
  url: string;
  name?: string;
  description?: string;
}

interface CloudinaryImageGalleryProps {
  images: ImageGalleryItem[];
  onDelete?: (id: string, url: string) => void;
  onImageClick?: (image: ImageGalleryItem) => void;
  editable?: boolean;
  columns?: 2 | 3 | 4 | 5;
  showNames?: boolean;
}

export default function CloudinaryImageGallery({
  images,
  onDelete,
  onImageClick,
  editable = true,
  columns = 4,
  showNames = true,
}: CloudinaryImageGalleryProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string, url: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this image?');
    if (!confirmed) return;

    try {
      setDeletingIds((prev) => new Set(prev).add(id));

      // Extract public_id and delete from Cloudinary
      const publicId = extractPublicId(url);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }

      // Notify parent component
      onDelete?.(id, url);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  }[columns];

  if (images.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridColsClass} gap-4`}>
      {images.map((image) => {
        const isDeleting = deletingIds.has(image.id);

        return (
          <div
            key={image.id}
            className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div
              className={`relative aspect-square cursor-pointer ${isDeleting ? 'opacity-50' : ''}`}
              onClick={() => !isDeleting && onImageClick?.(image)}
            >
              <Image
                src={getCloudinaryThumbnail(image.url, 400, 400)}
                alt={image.name || 'Image'}
                fill
                className="object-cover"
                unoptimized
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
            </div>

            {/* Delete button */}
            {editable && (
              <button
                onClick={() => handleDelete(image.id, image.url)}
                disabled={isDeleting}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50"
                title="Delete image"
              >
                {isDeleting ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
              </button>
            )}

            {/* Image info */}
            {showNames && (image.name || image.description) && (
              <div className="p-3 bg-white">
                {image.name && (
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {image.name}
                  </h3>
                )}
                {image.description && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {image.description}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
