// Cloudinary configuration and utilities
// Add these to your .env.local file:
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
// NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
// NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
// CLOUDINARY_API_SECRET=your_api_secret (keep this on server-side only)

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "",
};

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  resource_type: string;
  type: string;
}

export interface CloudinaryError {
  message: string;
  http_code?: number;
}

/**
 * Upload an image to Cloudinary
 * @param file - The file to upload
 * @param folder - Optional folder name in Cloudinary
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with upload response
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string,
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    if (folder) {
      formData.append("folder", folder);
    }

    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response as CloudinaryUploadResponse);
      } else {
        reject({
          message: "Upload failed",
          http_code: xhr.status,
        } as CloudinaryError);
      }
    });

    xhr.addEventListener("error", () => {
      reject({
        message: "Network error during upload",
      } as CloudinaryError);
    });

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Delete an image from Cloudinary
 * This requires a server-side API route because it needs your API secret
 * @param publicId - The public_id of the image to delete
 * @returns Promise indicating success or failure
 */
export async function deleteFromCloudinary(
  publicId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete image");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
}

/**
 * Extract public_id from Cloudinary URL
 * @param url - Cloudinary image URL
 * @returns The public_id or null if not found
 */
export function extractPublicId(url: string): string | null {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
}

/**
 * Generate a thumbnail URL from a Cloudinary URL
 * @param url - Original Cloudinary URL
 * @param width - Thumbnail width
 * @param height - Thumbnail height
 * @returns Transformed thumbnail URL
 */
export function getCloudinaryThumbnail(
  url: string,
  width: number = 200,
  height: number = 200,
): string {
  if (!url.includes("cloudinary.com")) {
    return url;
  }

  // Insert transformation parameters
  return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill/`);
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
  allowedTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
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
