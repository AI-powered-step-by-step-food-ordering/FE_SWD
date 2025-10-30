"use client";
import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CheckoutFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    const hasStatus = (searchParams.get('status') || '').length > 0;
    const url = `/payment/result?${hasStatus ? qs : (qs ? `${qs}&status=fail` : 'status=fail')}`;
    router.replace(url);
  }, [router, searchParams]);

  return null;
}

export default function CheckoutFailed() {
  return (
    <Suspense fallback={null}>
      <CheckoutFailedContent />
    </Suspense>
  );
}

