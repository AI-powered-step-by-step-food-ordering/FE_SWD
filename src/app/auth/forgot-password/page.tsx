'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const { navigateWithLoading, showLoading, hideLoading } = usePageLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading();
      const { authService } = await import('@/services');
      const response = await authService.forgotPassword({ email });
      if (response.success) {
        toast.success('📧 OTP sent to your email.');
        setTimeout(() => {
          navigateWithLoading(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        }, 800);
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send OTP';
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

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password</h2>
          <p className="text-gray-600 mb-6">Enter your email to receive a reset OTP.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400"
                placeholder="you@example.com"
                required
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-semibold">Send OTP</button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-800">Back to login</Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-emerald-50 p-12">
        <div className="text-center">
          <Image src="/images/login/Healthyfood.png" alt="Fresh healthy food" width={500} height={500} className="w-full h-[500px] object-cover" />
          <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Reset easily with OTP</h3>
          <p className="text-gray-600 text-lg">We keep your account secure</p>
        </div>
      </div>
    </div>
  );
}







