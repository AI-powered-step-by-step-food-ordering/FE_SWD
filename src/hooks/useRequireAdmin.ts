import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function useRequireAdmin() {
  const router = useRouter();
  const { user, isAuthenticated, hydrateFromCookies, hasHydrated } = useAuthStore();

  // Đảm bảo luôn load state từ cookie
  useEffect(() => {
    hydrateFromCookies?.();
  }, [hydrateFromCookies]);

  useEffect(() => {
    // Chỉ quyết định redirect sau khi đã hydrate xong từ cookies
    if (!hasHydrated) return;
    if (!isAuthenticated || user?.role?.toUpperCase() !== 'ADMIN') {
      router.replace('/');
    }
  }, [hasHydrated, isAuthenticated, user, router]);
}
