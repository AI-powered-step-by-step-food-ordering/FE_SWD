import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function useRequireAdmin() {
  const router = useRouter();
  const { user, isAuthenticated, hydrateFromCookies } = useAuthStore();

  // Đảm bảo luôn load state từ cookie
  useEffect(() => {
    hydrateFromCookies?.();
  }, [hydrateFromCookies]);

  useEffect(() => {
    // Nếu chưa xác thực hoặc không phải admin → redirect
    if (!isAuthenticated || user?.role?.toUpperCase() !== 'ADMIN') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);
}
