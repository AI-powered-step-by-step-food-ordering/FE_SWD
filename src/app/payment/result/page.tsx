'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { zaloPayService, orderService, paymentService } from '@/services';
import { Order, PaymentTransaction } from '@/types/api.types';
import Link from 'next/link';
import { formatVND } from '@/lib/format-number';

type QueryStatus = 'idle' | 'loading' | 'success' | 'failed';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentTxn, setPaymentTxn] = useState<PaymentTransaction | null>(null);
  const orderHistoryHref = useMemo(() => (order?.id ? `/order-history/${order.id}` : '/order-history'), [order]);

  const isZaloSuccess = (raw: any): boolean => {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const rc = parsed?.return_code ?? parsed?.returnCode;
      const src = parsed?.sub_return_code ?? parsed?.subReturnCode;
      const processing = parsed?.is_processing ?? parsed?.isProcessing;
      // ZaloPay success when sub_return_code === 1 (or return_code === 1) and not processing
      return (src === 1 || rc === 1) && processing === false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const appTransId = searchParams.get('appTransId') || searchParams.get('apptransid');
    const paymentTransactionId = searchParams.get('paymentTransactionId') || searchParams.get('payment_transaction_id');
    const statusParam = (searchParams.get('status') || '').toLowerCase();
    const messageParam = searchParams.get('message') || '';
    const orderId = searchParams.get('orderId') || '';

    const checkStatus = async () => {
      // If BE already decided success/fail and redirected with a status param, honor it
      if (statusParam === 'success' || statusParam === 'fail') {
        setStatus(statusParam === 'success' ? 'success' : 'failed');
        setMessage(messageParam);
        // Fetch details if available
        try {
          let loadedOrderId = orderId;
          if (paymentTransactionId) {
            const pt = await paymentService.getById(paymentTransactionId);
            if (pt?.success && pt.data) {
              setPaymentTxn(pt.data);
              if (!loadedOrderId && pt.data.orderId) loadedOrderId = pt.data.orderId;
            }
          }
          if (loadedOrderId) {
            const ord = await orderService.getById(loadedOrderId);
            if (ord?.success && ord.data) setOrder(ord.data);
          }
        } catch {}
        return;
      }

      setStatus('loading');
      try {
        if (paymentTransactionId) {
          const res = await zaloPayService.updateStatus(paymentTransactionId);
          if (res.success) {
            // Backends may always return success for query/update; inspect data payload
            const paid = isZaloSuccess((res as any).data);
            setStatus(paid ? 'success' : 'failed');
            setMessage(res.message || (paid ? 'Payment successful' : 'Payment failed'));
            // Try fetch payment transaction and order if provided
            try {
              const pt = await paymentService.getById(paymentTransactionId);
              if (pt?.success && pt.data) {
                setPaymentTxn(pt.data);
                const idToLoad = orderId || pt.data.orderId;
                if (idToLoad) {
                  const ord = await orderService.getById(idToLoad);
                  if (ord?.success && ord.data) setOrder(ord.data);
                }
              }
            } catch {}
            return;
          }
          setStatus('failed');
          setMessage(res.message || 'Payment failed');
          // Still try to show available details
          try {
            const pt = await paymentService.getById(paymentTransactionId);
            if (pt?.success && pt.data) {
              setPaymentTxn(pt.data);
              const idToLoad = orderId || pt.data.orderId;
              if (idToLoad) {
                const ord = await orderService.getById(idToLoad);
                if (ord?.success && ord.data) setOrder(ord.data);
              }
            } else if (orderId) {
              const ord = await orderService.getById(orderId);
              if (ord?.success && ord.data) setOrder(ord.data);
            }
          } catch {}
          return;
        }

        if (appTransId) {
          const res = await zaloPayService.query(appTransId);
          if (res.success) {
            const paid = isZaloSuccess((res as any).data);
            setStatus(paid ? 'success' : 'failed');
            setMessage(res.message || (paid ? 'Payment successful' : 'Payment failed'));
            try {
              if (orderId) {
                const ord = await orderService.getById(orderId);
                if (ord?.success && ord.data) setOrder(ord.data);
              }
            } catch {}
            return;
          }
          setStatus('failed');
          setMessage(res.message || 'Payment failed');
          try {
            if (orderId) {
              const ord = await orderService.getById(orderId);
              if (ord?.success && ord.data) setOrder(ord.data);
            }
          } catch {}
          return;
        }

        setStatus('failed');
        setMessage('Missing transaction identifiers');
      } catch (e: any) {
        setStatus('failed');
        setMessage(e?.message || 'Unable to verify payment');
      }
    };

    checkStatus();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 px-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-green-100">
        <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-600 border-t-transparent mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Verifying payment…</h1>
            <p className="text-gray-600">Please wait a moment while we confirm your payment status.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-700 mb-2 tracking-tight">Payment Successful</h1>
            <p className="text-gray-600 mb-6">{message || 'Your order has been confirmed.'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href={orderHistoryHref} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 shadow hover:shadow-lg transition text-center">
                View Order History
              </Link>
              <Link href="/" className="w-full py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 border border-gray-200 transition text-center">
                Back to Home
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-red-700 mb-2 tracking-tight">Payment Failed</h1>
            <p className="text-gray-600 mb-6">{message || 'We could not confirm your payment.'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/order" className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow hover:shadow-lg transition text-center">
                Try Again
              </Link>
              <Link href={orderHistoryHref} className="w-full py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 border border-gray-200 transition text-center">
                View Order History
              </Link>
            </div>
          </>
        )}
        </div>

        {(order || paymentTxn) && (
          <div className="mt-8 border-t pt-6 grid grid-cols-1 gap-6 text-sm text-gray-700">
            {/* Order Details Card */}
            {order && (
              <div className="rounded-2xl border border-gray-100 bg-white/60 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900">Order Details</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    (order.status||'').toUpperCase()==='CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Order ID:</span>
                    <span className="font-mono break-all">{order.id}</span>
                    <button
                      onClick={()=>{ try{ navigator.clipboard.writeText(order.id); }catch{} }}
                      className="ml-auto sm:ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50"
                      title="Copy"
                      type="button"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-semibold text-emerald-700">{formatVND(order.totalAmount || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details Card */}
            {paymentTxn && (
              <div className="rounded-2xl border border-gray-100 bg-white/60 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900">Payment Transaction</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    (paymentTxn.status||'').toUpperCase()==='SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {paymentTxn.status}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="truncate"><span className="text-gray-500">Txn ID:</span> <span className="font-mono break-all">{paymentTxn.id}</span></div>
                  <div><span className="text-gray-500">Method:</span> {paymentTxn.method}</div>
                  <div><span className="text-gray-500">Amount:</span> <span className="font-semibold text-emerald-700">{formatVND(paymentTxn.amount || 0)}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 px-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-green-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-600 border-t-transparent mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-800 mb-2">Loading…</h1>
              <p className="text-gray-600">Preparing your payment result.</p>
            </div>
          </div>
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}


