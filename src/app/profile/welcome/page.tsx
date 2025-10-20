'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  name: string;
  email: string;
  goal: string;
  allergies: string[];
  workSchedule: string;
}

export default function WelcomePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  const getGoalEmoji = (goal: string) => {
    switch (goal) {
      case 'slim-fit': return '🏃‍♀️';
      case 'muscle-gain': return '💪';
      case 'fat-loss': return '🔥';
      default: return '⚖️';
    }
  };

  const getGoalName = (goal: string) => {
    return goal.replace('-', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Animation */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {user.name}! 🎉
            </h1>
            <p className="text-gray-600">
              Your account has been created successfully
            </p>
          </div>

          {/* Profile Summary */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h2 className="font-bold text-gray-900 mb-4">Your Profile Summary</h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getGoalEmoji(user.goal)}</span>
                <div>
                  <p className="font-medium text-gray-900">Goal: {getGoalName(user.goal)}</p>
                  <p className="text-sm text-gray-600">AI will optimize meals for this goal</p>
                </div>
              </div>

              {user.allergies.length > 0 && (
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-medium text-gray-900">Allergies: {user.allergies.join(', ')}</p>
                    <p className="text-sm text-gray-600">We'll warn you about these ingredients</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <p className="font-medium text-gray-900">Work Schedule: {user.workSchedule.replace('-', ' ')}</p>
                  <p className="text-sm text-gray-600">Optimized for your schedule</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">What's Next?</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="font-medium text-green-800">AI-Powered Recommendations</p>
                    <p className="text-sm text-green-600">Get personalized meal suggestions</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-medium text-blue-800">Real-time Nutrition Tracking</p>
                    <p className="text-sm text-blue-600">See calories & macros as you build</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-medium text-purple-800">Quick Reorders</p>
                    <p className="text-sm text-purple-600">One-tap reorder your favorites</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 space-y-3">
            <Link
              href="/order"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-block"
            >
              🥗 Build Your First Bowl
            </Link>
            
            <Link
              href="/profile"
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-block"
            >
              ⚙️ Manage Profile
            </Link>
          </div>

          {/* Tips for Office Workers */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">💡 Pro Tip for Office Workers:</p>
            <p className="text-sm text-yellow-700">
              Order during off-peak hours (before 11:15 AM or after 1:30 PM) for faster delivery!
            </p>
          </div>
        </div>

        {/* Skip to Homepage */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-green-600 hover:text-green-700 text-sm font-medium">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
