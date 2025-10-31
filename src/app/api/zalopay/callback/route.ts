import { NextResponse } from 'next/server';
import apiClient from '@/services/api.config';

// ZaloPay expects a 200 with JSON body: { return_code: 1, return_message: "success" }
// This route forwards the callback payload to your backend if API_BASE_URL is configured.

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));

    // Best-effort forward to backend if configured.
    // On server-side, apiClient will not attach browser cookies (fine for public callback).
    try {
      await apiClient.post('/api/zalopay/callback', payload);
    } catch (e) {
      // Swallow forwarding errors to still acknowledge ZaloPay; log on server for observability
      console.error('ZaloPay callback forward failed:', e);
    }

    return NextResponse.json({ return_code: 1, return_message: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('ZaloPay callback error:', error);
    // Even on error, ZaloPay prefers a 200 with failure code to stop retries when appropriate.
    return NextResponse.json({ return_code: -1, return_message: 'error' }, { status: 200 });
  }
}


