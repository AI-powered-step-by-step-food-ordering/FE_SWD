import apiClient from './api.config';
import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types/api.types';
import { setAuthCookies, clearAuthCookies, getAuthToken, getCookie, setCookie, isAuthenticatedViaCookie } from '@/lib/auth-utils';

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/login',
      credentials
    );
    
    // Normalize backend response: some environments return { status, message, data } without 'success'
    const raw: any = response.data as any;
    const successNormalized: boolean = typeof raw.success === 'boolean' ? raw.success : (raw.status === 200);
    const codeNormalized: number = typeof raw.code === 'number' ? raw.code : raw.status;
    const dataNormalized: any = raw.data ?? raw;

    // Only store tokens if response is successful and has tokens
    if (successNormalized && dataNormalized) {
      const { accessToken, refreshToken, email, fullName, id, goalCode, role, status, emailVerified } = dataNormalized as AuthResponse & { emailVerified?: boolean };

      const isVerified = !(emailVerified === false || status === 'PENDING_VERIFICATION');
      if (!isVerified) {
        clearAuthCookies();
        return { success: false, code: codeNormalized ?? 200, message: 'Email not verified', data: dataNormalized } as any;
      }

      if (accessToken && refreshToken) {
        const userData = {
          id: id || email,
          email,
          fullName,
          name: fullName,
          role: role || 'USER',
          goalCode: goalCode || null,
          status: status || 'ACTIVE',
          createdAt: new Date().toISOString(),
          loginTime: new Date().toISOString(),
        };
        setAuthCookies({ accessToken, refreshToken }, userData);
      }
    }
    
    // Return a normalized ApiResponse
    return {
      success: successNormalized,
      code: codeNormalized ?? 200,
      message: raw.message ?? '',
      data: dataNormalized as AuthResponse,
    } as ApiResponse<AuthResponse>;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    // Prepare payload with default USER role
    const payload: any = {
      role: userData.role || 'USER', // Default to USER role
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.passwordConfirm,
    };
    
    // Only add goalCode if provided
    if (userData.goalCode) {
      payload.goalCode = userData.goalCode;
    }
    
    console.log('Registration attempt with payload:', {
      ...payload,
      password: '***hidden***'
    });
    
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/register',
      payload
    );
    
    console.log('Registration response:', {
      success: response.data.success,
      code: response.data.code,
      message: response.data.message,
    });
    
    // Note: Don't store tokens for registration as user needs to verify email first
    // Tokens will be stored after successful email verification
    
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<Record<string, never>>> {
    try {
      const response = await apiClient.post<ApiResponse<Record<string, never>>>(
        '/api/auth/logout'
      );
      
      // Clear cookies only
      clearAuthCookies();
      
      return response.data;
    } catch (error) {
      // Always clear cookies even if API call fails
      clearAuthCookies();
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenData: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/refresh',
      refreshTokenData
    );
    
    // Update tokens in cookies
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken } = response.data.data;
      setCookie('accessToken', accessToken, 7);
      setCookie('refreshToken', refreshToken, 30);
    }
    
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return isAuthenticatedViaCookie();
  }

  /**
   * Get stored user data
   */
  getCurrentUser(): any {
    const userCookie = getCookie('user');
    try {
      return userCookie ? JSON.parse(decodeURIComponent(userCookie)) : null;
    } catch {
      return null;
    }
  }

  /**
   * Resend verification OTP to email
   */
  async resendVerificationOtp(email: string): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.post<ApiResponse<Record<string, never>>>(
      '/api/auth/resend-verification-otp',
      {},
      { params: { email } }
    );
    return response.data;
  }

  /**
   * Verify email using 6-digit OTP
   */
  async verifyOtp(payload: VerifyOtpRequest): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.post<ApiResponse<Record<string, never>>>(
      '/api/auth/verify-otp',
      payload
    );
    return response.data;
  }

  /**
   * Forgot password - send OTP to email
   */
  async forgotPassword(payload: ForgotPasswordRequest): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.post<ApiResponse<Record<string, never>>>(
      '/api/auth/forgot-password',
      payload
    );
    return response.data;
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(payload: ResetPasswordRequest): Promise<ApiResponse<Record<string, never>>> {
    const response = await apiClient.post<ApiResponse<Record<string, never>>>(
      '/api/auth/reset-password',
      payload
    );
    return response.data;
  }
}

const authService = new AuthService();
export default authService;
export { authService };

