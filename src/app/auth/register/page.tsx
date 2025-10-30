'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { usePageLoading } from '@/hooks/usePageLoading';
import { toast } from 'react-toastify';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  goalCode: string;
  dateOfBirth: string;
  phone: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    goalCode: 'MAINTAIN_WEIGHT',
    dateOfBirth: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const router = useRouter();
  const { navigateWithLoading, showLoading, hideLoading } = usePageLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('❌ Passwords do not match!', {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    setError('');
    
    // Show global loading
    showLoading();

    try {
      // Call real API with proper payload structure
      const { authService } = await import('@/services');
      const response = await authService.register({
        role: 'USER', // Default role
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        goalCode: formData.goalCode,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.phone
      });

      if (response.success) {
        // Hide loading
        hideLoading();
        
        // Show success toast with verification message
        toast.success('🎉 Registration successful! Please check your email to verify your account.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Redirect to verification page with email parameter
        setTimeout(() => {
          navigateWithLoading(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
      
    } catch (err: any) {
      // Hide loading
      hideLoading();
      
      // Show error toast with specific message
      const errorMessage = err?.response?.data?.message || err?.message || 'Registration failed! Please try again.';
      toast.error(`❌ ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setError(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        <div className="mb-6">
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-3 font-sans">Join Our Community</h2>
          <p className="text-gray-600 text-lg leading-relaxed font-light">
            Start your healthy eating journey with personalized nutrition.
          </p>
        </div>


        {/* Registration Form */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm shadow-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="md:col-span-1">
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
                  placeholder="Create a secure password"
                />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-3">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md"
                  placeholder="Confirm your password"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="goalCode" className="block text-sm font-semibold text-gray-700 mb-3">
                  Health Goal
                </label>
                <select
                  id="goalCode"
                  name="goalCode"
                  value={formData.goalCode}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 shadow-sm hover:shadow-md"
                >
                  <option value="MAINTAIN_WEIGHT">⚖️ Maintain Weight</option>
                  <option value="LOSE_WEIGHT">🔥 Lose Weight</option>
                  <option value="GAIN_WEIGHT">💪 Gain Weight</option>
                  <option value="BUILD_MUSCLE">🏋️‍♂️ Build Muscle</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 mb-3">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 shadow-sm hover:shadow-md"
                />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-3">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-3 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md"
                  placeholder="Enter your phone number"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 focus:ring-4 focus:ring-emerald-200 mt-6"
              >
                Create Account
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors duration-200">
                Sign in now
              </Link>
            </p>
          </div>
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
          <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Fresh & Vibrant</h3>
          <p className="text-gray-600 text-lg">Colorful nutrition for your wellness journey</p>
        </div>
      </div>
    </div>
  );
}
