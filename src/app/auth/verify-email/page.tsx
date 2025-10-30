'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { usePageLoading } from '@/hooks/usePageLoading';
import { toast } from 'react-toastify';

function VerifyEmailForm() {
  const [email, setEmail] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null, null, null]);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { navigateWithLoading, showLoading, hideLoading } = usePageLoading();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otp = otpValues.join('');
    if (!email || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    try {
      showLoading();
      const { authService } = await import('@/services');
      const response = await authService.verifyOtp({ email, otp });
      if (response.success) {
        toast.success('✅ Email verified! Please log in.');
        setTimeout(() => navigateWithLoading('/auth/login'), 800);
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Verification failed';
      setError(msg);
      toast.error(`❌ ${msg}`);
    } finally {
      hideLoading();
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('❌ Please enter your email');
      return;
    }
    setIsResending(true);
    try {
      const { authService } = await import('@/services');
      const response = await authService.resendVerificationOtp(email);
      if (response.success) {
        toast.success('📧 OTP sent! Check your inbox.');
      } else {
        throw new Error(response.message || 'Failed to resend');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to resend';
      toast.error(`❌ ${msg}`);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpValues];
    next[index] = value;
    setOtpValues(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = pasted.split('');
    while (next.length < 6) next.push('');
    setOtpValues(next);
    const lastIndex = Math.min(5, pasted.length - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-emerald-50">
      <div className="p-8 lg:p-12 flex flex-col justify-center bg-emerald-50">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">🥗</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Fresh Bowl</h1>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
          <p className="text-gray-600 mb-6">Enter the 6-digit code we sent to your email.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm shadow-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            {/* Email is kept in state from query param; not shown in UI */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">6-digit OTP</label>
              <div className="flex items-center justify-between gap-3" onPaste={handleOtpPaste}>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-12 md:w-14 md:h-14 border-2 border-gray-200 rounded-xl text-center text-lg md:text-xl font-semibold focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-semibold">Verify Email</button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <button onClick={handleResend} disabled={isResending || !email} className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
              {isResending ? 'Sending…' : 'Resend code'}
            </button>
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-800">Back to login</Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-emerald-50 p-12">
        <div className="text-center">
          <Image src="/images/login/Healthyfood.png" alt="Fresh healthy food" width={500} height={500} className="w-full h-[500px] object-cover" />
          <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Welcome to Fresh Bowl!</h3>
          <p className="text-gray-600 text-lg">Your healthy journey starts here</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
