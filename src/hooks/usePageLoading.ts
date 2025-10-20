'use client';

import { useLoading } from '@/components/shared/LoadingProvider';

/**
 * Hook to manually control loading state
 * Useful for API calls, form submissions, etc.
 */
export function usePageLoading() {
  const { isLoading, showLoading, hideLoading, navigateWithLoading } = useLoading();

  return {
    isLoading,
    showLoading,
    hideLoading,
    navigateWithLoading
  };
}

/**
 * Hook to show loading for async operations
 */
export function useAsyncLoading() {
  const { showLoading, hideLoading } = useLoading();

  const withLoading = async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    showLoading();
    try {
      const result = await asyncFn();
      return result;
    } finally {
      // Add small delay to prevent flashing
      setTimeout(() => hideLoading(), 300);
    }
  };

  return { withLoading };
}
