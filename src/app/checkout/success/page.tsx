'use client';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckoutSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    const hasStatus = (searchParams.get('status') || '').length > 0;
    const url = `/payment/result?${hasStatus ? qs : (qs ? `${qs}&status=success` : 'status=success')}`;
    router.replace(url);
  }, [router, searchParams]);

  return null;
}
