'use client';

import { create } from 'zustand';
import { getCookie } from '@/lib/auth-utils';

export interface AuthUserState {
  id?: string;
  email?: string;
  fullName?: string;
  role?: string;
  goalCode?: string | null;
  status?: string;
  imageUrl?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUserState | null;
  setAuthenticated: (isAuth: boolean) => void;
  setUser: (user: AuthUserState | null) => void;
  hydrateFromCookies: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
  setUser: (user) => set({ user }),
  hydrateFromCookies: () => {
    if (typeof window === 'undefined') return;
    const isAuth = getCookie('isAuthenticated') === 'true';
    const userCookie = getCookie('user');
    try {
      const user = userCookie ? JSON.parse(decodeURIComponent(userCookie)) : null;
      set({ isAuthenticated: !!(isAuth && getCookie('accessToken')), user });
    } catch {
      set({ isAuthenticated: false, user: null });
    }
  },
  clear: () => set({ isAuthenticated: false, user: null }),
}));


