// Firebase Storage utilities for upload, delete, and manage images
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
  StorageReference,
} from 'firebase/storage';
import { storage } from './firebase';

export interface FirebaseUploadResponse {
  url: string;
  fullPath: string;
  name: string;
  size: number;
  contentType: string;
}

export interface FirebaseError {
  message: string;
  code?: string;
}

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param folder - Folder path in Firebase Storage (e.g., 'ingredients', 'categories')
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise with upload response including download URL
 */
export async function uploadToFirebase(
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<FirebaseUploadResponse> {
  return new Promise((resolve, reject) => {
    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `${folder}/${fileName}`;

      // Create storage reference
      const storageRef: StorageReference = ref(storage, filePath);

      // Start upload
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          // Firebase Storage error codes
          let errorMessage = error.message || 'Upload failed';
          if (error.code) {
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = 'Bạn không có quyền upload ảnh. Vui lòng kiểm tra quyền truy cập Firebase Storage.';
                break;
              case 'storage/canceled':
                errorMessage = 'Upload đã bị hủy.';
                break;
              case 'storage/unknown':
                errorMessage = 'Lỗi không xác định khi upload.';
                break;
              case 'storage/quota-exceeded':
                errorMessage = 'Dung lượng lưu trữ đã hết.';
                break;
              case 'storage/unauthenticated':
                errorMessage = 'Chưa xác thực. Vui lòng đăng nhập lại.';
                break;
              default:
                errorMessage = error.message || `Lỗi: ${error.code}`;
            }
          }
          reject({
            message: errorMessage,
            code: error.code,
          } as FirebaseError);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            resolve({
              url: downloadURL,
              fullPath: uploadTask.snapshot.ref.fullPath,
              name: fileName,
              size: uploadTask.snapshot.totalBytes,
              contentType: file.type,
            });
          } catch (error: any) {
            console.error('Error getting download URL:', error);
            reject({
              message: error?.message || 'Failed to get download URL after upload',
              code: error?.code || 'download-url-error',
            } as FirebaseError);
          }
        }
      );
    } catch (error: any) {
      console.error('Unexpected upload error:', error);
      reject({
        message: error instanceof Error ? error.message : (error?.message || 'Upload failed'),
        code: error?.code || 'unknown-error',
      } as FirebaseError);
    }
  });
}

/**
 * Delete a file from Firebase Storage
 * @param fileUrl - The download URL or full path of the file
 * @returns Promise indicating success or failure
 */
export async function deleteFromFirebase(
  fileUrl: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Extract path from URL or use directly if it's a path
    const filePath = extractPathFromUrl(fileUrl);
    
    if (!filePath) {
      throw new Error('Invalid file URL or path');
    }

    // Create reference to the file
    const fileRef: StorageReference = ref(storage, filePath);

    // Delete the file
    await deleteObject(fileRef);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting from Firebase:', error);
    
    // If file doesn't exist, consider it a success
    if (error.code === 'storage/object-not-found') {
      return {
        success: true,
        message: 'File not found (may have been already deleted)',
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to delete file',
    };
  }
}

/**
 * Extract Firebase Storage path from download URL
 * @param url - Firebase Storage download URL
 * @returns The storage path or null if invalid
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    // If it's already a path (not a URL), return it
    if (!url.includes('http://') && !url.includes('https://')) {
      return url;
    }

    // Firebase Storage URL format:
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
    
    if (pathMatch && pathMatch[1]) {
      // Decode the path (Firebase encodes it)
      return decodeURIComponent(pathMatch[1]);
    }

    return null;
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    return null;
  }
}

/**
 * Get a resized image URL using Firebase Storage's built-in transformation
 * Note: Firebase doesn't have built-in image transformation like Cloudinary
 * This returns the original URL. For thumbnails, consider using Cloud Functions
 * or a separate image processing service
 * @param url - Original image URL
 * @param width - Desired width (not used in Firebase by default)
 * @param height - Desired height (not used in Firebase by default)
 * @returns The original URL (Firebase doesn't have built-in transformations)
 */
export function getFirebaseThumbnail(
  url: string,
  width?: number,
  height?: number
): string {
  // Firebase Storage doesn't have built-in image transformations
  // You would need to:
  // 1. Use Firebase Extensions (Resize Images)
  // 2. Use Cloud Functions to generate thumbnails
  // 3. Pre-generate thumbnails during upload
  // 4. Use a third-party service
  
  // For now, return original URL
  // You can implement thumbnail logic based on your setup
  return url;
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5MB)
 * @param allowedTypes - Allowed MIME types
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Get file metadata from Firebase Storage
 * @param fileUrl - The download URL or path
 * @returns File metadata
 */
export async function getFileMetadata(fileUrl: string) {
  try {
    const filePath = extractPathFromUrl(fileUrl);
    if (!filePath) {
      throw new Error('Invalid file URL');
    }

    const fileRef = ref(storage, filePath);
    const metadata = await getDownloadURL(fileRef);
    
    return metadata;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
}
