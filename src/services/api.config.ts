import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getCookie, setCookie, clearAuthCookies } from '@/lib/auth-utils';

// Use environment variable when available (Next.js exposes NEXT_PUBLIC_* to the browser)
// Fallback to empty string to avoid building URLs like "undefined/..."
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://cinezone.info:4458';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// A raw axios instance without interceptors for special calls (e.g., refresh token)
const rawClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Warn in development if base URL is not configured
if (typeof window !== 'undefined' && !API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('API base URL is not set. Configure NEXT_PUBLIC_API_BASE_URL to avoid relative \/api calls.');
}

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Read token from cookies only
    const token = typeof window !== 'undefined' ? getCookie('accessToken') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Normalize successful responses and handle token refresh on errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const contentType = response.headers?.['content-type'] || '';
    const isJson = contentType.includes('application/json');

    // Guard: If response is not JSON, likely hitting Next.js page or wrong domain
    if (!isJson) {
      // eslint-disable-next-line no-console
      console.error('Non-JSON response received. Check NEXT_PUBLIC_API_BASE_URL and endpoint paths.', {
        url: response.config?.url,
        status: response.status,
        contentType,
      });
      throw new Error('Unexpected non-JSON response from server');
    }

    const raw: any = response.data;

    // Normalize to common ApiResponse shape used across the app
    const normalized = {
      success: typeof raw?.success === 'boolean' ? raw.success : response.status >= 200 && response.status < 300,
      code: typeof raw?.code === 'number' ? raw.code : (typeof raw?.status === 'number' ? raw.status : response.status),
      message: typeof raw?.message === 'string' ? raw.message : (typeof raw?.msg === 'string' ? raw.msg : ''),
      data: raw?.data ?? raw?.result ?? raw?.content ?? raw?.items ?? (typeof raw === 'object' ? raw : null),
    };

    // Replace response data so services can rely on consistent shape
    (response as AxiosResponse<any>).data = normalized;
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Detect network errors (no response received)
    const isNetworkError = !error.response && error.message === 'Network Error';
    
    // Log error for debugging (dev only) - stringify to avoid "{}" in some consoles
    if (process.env.NODE_ENV !== 'production') {
      try {
        const snapshot: any = {
          url: originalRequest?.url,
          method: originalRequest?.method,
          baseURL: originalRequest?.baseURL || API_BASE_URL,
          status: error.response?.status,
          message: error.message,
        };
        
        if (isNetworkError) {
          snapshot.errorType = 'Network Error';
          snapshot.suggestion = 'Check if backend server is running and API_BASE_URL is correct';
          snapshot.apiBaseUrl = API_BASE_URL;
        }
        
        // Include a safe preview of response data
        const respData = (error as any)?.response?.data;
        snapshot.data = typeof respData === 'string' ? respData : JSON.stringify(respData ?? null);
        // eslint-disable-next-line no-console
        console.error('API Error:', JSON.stringify(snapshot, null, 2));
        
        // Additional helpful message for network errors
        if (isNetworkError) {
          // eslint-disable-next-line no-console
          console.error(`⚠️ Network Error: Cannot reach API at ${API_BASE_URL || 'undefined'}. 
          Make sure:
          1. Backend server is running
          2. NEXT_PUBLIC_API_BASE_URL is set correctly in .env.local
          3. CORS is configured on the backend
          4. No firewall is blocking the connection`);
        }
      } catch {
        // eslint-disable-next-line no-console
        console.error('API Error:', error?.message || 'Unknown error');
      }
    }

    // If error is 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? getCookie('refreshToken') : null;
        if (refreshToken) {
          // Use raw client to avoid interceptor recursion and avoid malformed URL
          const response = await rawClient.post(`/api/auth/refresh`, { refreshToken });

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            if (typeof window !== 'undefined') {
              setCookie('accessToken', accessToken, 7);
              setCookie('refreshToken', newRefreshToken, 30);
            }

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        console.error('Token refresh failed:', refreshError);
        clearAuthCookies();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

