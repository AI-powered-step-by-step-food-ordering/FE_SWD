'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  validateImageFile,
  getCloudinaryThumbnail,
  type CloudinaryUploadResponse,
} from '@/lib/cloudinary';

interface CloudinaryImageUploadProps {
  value?: string; // Current image URL
  onChange: (url: string) => void; // Callback when image changes
  onDelete?: () => void; // Optional callback when image is deleted
  folder?: string; // Cloudinary folder name
  label?: string;
  maxSizeMB?: number;
  className?: string;
  showPreview?: boolean;
  disabled?: boolean;
}

export default function CloudinaryImageUpload({
  value,
  onChange,
  onDelete,
  folder = 'healthy-food',
  label = 'Upload Image',
  maxSizeMB = 5,
  className = '',
  showPreview = true,
  disabled = false,
}: CloudinaryImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);

    // Validate file
    const validation = validateImageFile(file, maxSizeMB);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload to Cloudinary
      const result: CloudinaryUploadResponse = await uploadToCloudinary(
        file,
        folder,
        (progress) => setUploadProgress(progress)
      );

      // Update parent component with the new image URL
      onChange(result.secure_url);
      setPreviewUrl(result.secure_url);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl(value || null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!value) return;

    const confirmed = window.confirm('Are you sure you want to delete this image?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      // Extract public_id from URL
      const publicId = extractPublicId(value);
      if (!publicId) {
        throw new Error('Invalid Cloudinary URL');
      }

      // Delete from Cloudinary
      await deleteFromCloudinary(publicId);

      // Clear preview and notify parent
      setPreviewUrl(null);
      onChange('');
      onDelete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Preview */}
      {showPreview && previewUrl && (
        <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <div className="relative w-full h-48">
            <Image
              src={getCloudinaryThumbnail(previewUrl, 400, 300)}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          
          {/* Delete button overlay */}
          {value && !disabled && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
              title="Delete image"
            >
              {deleting ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}

      {/* Upload button and progress */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        <button
          onClick={handleBrowse}
          disabled={disabled || uploading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : previewUrl ? 'Change Image' : 'Select Image'}
        </button>

        {/* Upload progress bar */}
        {uploading && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        Supported formats: JPEG, PNG, GIF, WebP. Max size: {maxSizeMB}MB
      </p>
    </div>
  );
}
