'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import { usePageLoading } from '@/hooks/usePageLoading';

function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [step, setStep] = useState<number>(1);
  const searchParams = useSearchParams();
  const { navigateWithLoading, showLoading, hideLoading } = usePageLoading();

  useEffect(() => {
    const emailParam = searchParams.get('email') || '';
    setEmail(emailParam);
  }, [searchParams]);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = (otp || '').replace(/\D/g, '');
    if (cleaned.length !== 6) {
      toast.error('❌ OTP must be 6 digits');
      return;
    }
    setOtp(cleaned);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== passwordConfirm) {
      toast.error('❌ Passwords do not match');
      return;
    }
    try {
      showLoading();
      const { authService } = await import('@/services');
      const response = await authService.resetPassword({ email, otp, newPassword, passwordConfirm });
      if (response.success) {
        toast.success('✅ Password reset successful. Please log in.');
        setTimeout(() => navigateWithLoading('/auth/login'), 800);
      } else {
        throw new Error(response.message || 'Reset failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Reset failed';
      toast.error(`❌ ${msg}`);
    } finally {
      hideLoading();
    }
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

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
          <p className="text-gray-600 mb-6">{step === 1 ? 'Enter the OTP we sent to your email.' : 'Set your new password.'}</p>

          {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl bg-gray-100 text-gray-600"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400 tracking-widest"
                placeholder="—— ——"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password" className="text-emerald-600 hover:text-emerald-700">Resend OTP</Link>
              <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold">Continue</button>
            </div>
          </form>
          )}

          {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl bg-gray-100 text-gray-600"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={()=>setStep(1)} className="px-6 py-3 border border-gray-300 rounded-2xl">Back</button>
              <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold">Reset Password</button>
            </div>
          </form>
          )}

          <div className="flex items-center justify-between mt-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-800">Back to login</Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-emerald-50 p-12">
        <div className="text-center">
          <Image src="/images/login/Healthyfood.png" alt="Fresh healthy food" width={500} height={500} className="w-full h-[500px] object-cover" />
          <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Use your OTP to reset</h3>
          <p className="text-gray-600 text-lg">Secure password recovery</p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}




