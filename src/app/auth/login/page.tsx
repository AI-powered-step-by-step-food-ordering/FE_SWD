'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { usePageLoading } from '@/hooks/usePageLoading';
import { toast } from 'react-toastify';
import { authService } from '@/services';
import { useAuthStore } from '@/store/auth.store';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [redirectMessage, setRedirectMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { navigateWithLoading, showLoading, hideLoading } = usePageLoading();
  const setAuthenticated = useAuthStore(s => s.setAuthenticated);
  const setUser = useAuthStore(s => s.setUser);

  useEffect(() => {
    const from = searchParams.get('from');
    if (from === 'order') {
      setRedirectMessage('Please sign in to access the order page.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Show global loading
    showLoading();

    try {
      // Call real API
      const response = await authService.login(formData);
      
      if (response.success) {
        const data: any = response.data;
        // Treat as verified unless API explicitly says otherwise
        const isVerified = !(data?.emailVerified === false || data?.status === 'PENDING_VERIFICATION');

        if (!isVerified) {
          hideLoading();
          toast.info('Your email is not verified. Please enter the OTP we sent.', {
            position: "top-right",
            autoClose: 3000,
          });
          setTimeout(() => {
            const email = formData.email;
            navigateWithLoading(`/auth/verify-email?email=${encodeURIComponent(email)}`);
          }, 800);
          return;
        }
        // Hide loading
        hideLoading();
        
        // Show success toast
        toast.success('Login successful!', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Update store for UI
        setAuthenticated(true);
        setUser({
          id: data?.id,
          email: data?.email,
          fullName: data?.fullName,
          role: data?.role,
          goalCode: data?.goalCode ?? null,
          status: data?.status,
          imageUrl: data?.imageUrl,
          dateOfBirth: data?.dateOfBirth,
          address: data?.address,
          phone: data?.phone,
        });

        // Wait for toast to show, then redirect
        setTimeout(() => {
          navigateWithLoading('/');
        }, 1000); // Wait 1 second for toast visibility
      } else {
        throw new Error(response.message || 'Login failed');
      }
      
    } catch (err: any) {
      // Hide loading
      hideLoading();
      
      // Show error toast
      toast.error('Login failed! Please check your credentials and try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-emerald-50">
      {/* Left Side - Form */}
      <div className="p-8 lg:p-12 flex flex-col justify-center bg-emerald-50">
        <div className="max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🥗</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Fresh Bowl
            </h1>
          </Link>
        </div>

        {/* Form Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-3 font-sans">Welcome Back</h2>
          <p className="text-gray-600 text-lg leading-relaxed font-light">
            Sign in to continue your healthy journey with us.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {redirectMessage && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-5 py-4 rounded-2xl text-sm shadow-sm">
              <div className="flex items-center">  
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {redirectMessage}
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm shadow-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md"
              placeholder="Enter your password"
            />
            <div className="mt-3 text-right">
              <Link href="/auth/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 focus:ring-4 focus:ring-emerald-200"
          >
            Sign In
          </button>
        </form>


        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors duration-200">
              Sign up now
            </Link>
          </p>
        </div>
        </div>
      </div>

      {/* Right Side - Simple Food Image */}
      <div className="hidden lg:flex items-center justify-center bg-emerald-50 p-12">
        <div className="text-center">
          <Image 
            src="/images/login/Healthyfood.png" 
            alt="Fresh healthy food" 
            width={500}
            height={500}
            className="w-full h-[500px] object-cover"
          />
          <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Fresh & Nutritious</h3>
          <p className="text-gray-600 text-lg">Wholesome ingredients for a healthier you</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
