import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// This API route handles secure deletion of images from Cloudinary
// It should only be called from your admin panel with proper authentication

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { success: false, message: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, message: 'Cloudinary configuration is missing' },
        { status: 500 }
      );
    }

    // Generate signature for the delete request
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    // Call Cloudinary delete API
    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    
    const response = await fetch(deleteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const result = await response.json();

    if (result.result === 'ok') {
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.error?.message || 'Failed to delete image',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
