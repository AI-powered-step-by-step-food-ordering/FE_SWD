import { useRouter } from 'next/navigation';

// Cookie helpers (merged from cookie-utils)
export const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const clearAuthCookies = () => {
  deleteCookie('accessToken');
  deleteCookie('refreshToken');
  deleteCookie('isAuthenticated');
  deleteCookie('user');
};

export const setAuthCookies = (tokens: { accessToken: string; refreshToken: string }, user: any) => {
  setCookie('accessToken', tokens.accessToken, 7);
  setCookie('refreshToken', tokens.refreshToken, 30);
  setCookie('isAuthenticated', 'true', 7);
  setCookie('user', encodeURIComponent(JSON.stringify(user)), 7);
};

export const getAuthToken = (): string | null => {
  return getCookie('accessToken');
};

export const isAuthenticatedViaCookie = (): boolean => {
  const token = getAuthToken();
  const isAuth = getCookie('isAuthenticated');
  return !!token && isAuth === 'true';
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return isAuthenticatedViaCookie();
};

/**
 * Get user data from localStorage or cookies
 */
export const getStoredUser = (): any => {
  if (typeof window === 'undefined') return null;
  const userCookie = getCookie('user');
  try {
    return userCookie ? JSON.parse(decodeURIComponent(userCookie)) : null;
  } catch {
    return null;
  }
};

/**
 * Require authentication - redirect to login if not authenticated
 */
export const requireAuth = (router: any): boolean => {
  if (!isAuthenticated()) {
    router.push('/auth/login');
    return false;
  }
  return true;
};

/**
 * Get user ID from stored data
 */
export const getUserId = (): string | null => {
  const user = getStoredUser();
  return user?.id || user?.email || null;
};

/**
 * Check if user has specific role
 */
export const hasRole = (role: string): boolean => {
  const user = getStoredUser();
  return user?.role === role;
};
