'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';

interface UserData {
  name: string;
  email: string;
  goal?: string;
  allergies?: string[];
  workSchedule?: string;
  joinDate: string;
  orderHistory: any[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserData>>({});
  const router = useRouter();

  const commonAllergies = [
    'nuts', 'dairy', 'gluten', 'shellfish', 'eggs', 'soy', 'fish'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const isAuth = localStorage.getItem('isAuthenticated');
    
    if (!isAuth || !userData) {
      router.push('/auth/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    // Set default values for missing fields
    const userWithDefaults = {
      ...parsedUser,
      goal: parsedUser.goal || 'maintenance',
      allergies: parsedUser.allergies || [],
      workSchedule: parsedUser.workSchedule || 'flexible'
    };
    setUser(userWithDefaults);
    setEditData(userWithDefaults);
  }, [router]);

  const handleSave = () => {
    if (user && editData) {
      const updatedUser = { 
        ...user, 
        ...editData,
        // Ensure we have these fields
        goal: editData.goal || user.goal || 'maintenance',
        allergies: editData.allergies || user.allergies || [],
        workSchedule: editData.workSchedule || user.workSchedule || 'flexible'
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    router.push('/');
  };

  const handleAllergyToggle = (allergy: string) => {
    setEditData(prev => {
      const currentAllergies = prev.allergies || user?.allergies || [];
      return {
        ...prev,
        allergies: currentAllergies.includes(allergy)
          ? currentAllergies.filter(a => a !== allergy)
          : [...currentAllergies, allergy]
      };
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
            <div className="flex items-center space-x-6 mb-6 lg:mb-0">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-xl">
                  <span className="text-3xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{user.name}</h1>
                <p className="text-gray-600 mb-1">{user.email}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Lưu
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData(user);
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
              <div className="text-sm text-blue-700">Orders Completed</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">₹1,240</div>
              <div className="text-sm text-green-700">Total Spent</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">4.8★</div>
              <div className="text-sm text-emerald-700">Avg Rating</div>
            </div>
            <div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-lime-600 mb-2">18min</div>
              <div className="text-sm text-lime-700">Avg Delivery</div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Health Goals */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Mục tiêu sức khỏe
              </h2>
              
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getGoalEmoji(user.goal || 'maintenance')}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{getGoalName(user.goal || 'maintenance')}</p>
                        <p className="text-sm text-gray-600">Mục tiêu hiện tại</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Lịch làm việc
                    </h3>
                    <p className="text-gray-700 capitalize">{(user.workSchedule || 'flexible').replace('-', ' ')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mục tiêu chính</label>
                    <select
                      value={editData.goal || user.goal || 'maintenance'}
                      onChange={(e) => setEditData(prev => ({ ...prev, goal: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    >
                      <option value="maintenance">⚖️ Duy trì cân nặng</option>
                      <option value="slim-fit">🏃‍♀️ Giữ dáng thon gọn</option>
                      <option value="muscle-gain">💪 Tăng cơ bắp</option>
                      <option value="fat-loss">🔥 Giảm mỡ thừa</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lịch làm việc</label>
                    <select
                      value={editData.workSchedule || user.workSchedule || 'flexible'}
                      onChange={(e) => setEditData(prev => ({ ...prev, workSchedule: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    >
                      <option value="office-hours">🏢 Giờ hành chính (9-17h)</option>
                      <option value="flexible">🕐 Linh hoạt</option>
                      <option value="shift-work">🌙 Làm ca</option>
                      <option value="remote">🏠 Làm việc từ xa</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Dietary Restrictions */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                Hạn chế dinh dưỡng
              </h2>
              
              {!isEditing ? (
                <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                  {(user.allergies || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(user.allergies || []).map((allergy) => (
                        <span
                          key={allergy}
                          className="bg-amber-100 text-amber-800 px-3 py-2 rounded-full text-sm font-medium border border-amber-200"
                        >
                          ⚠️ {allergy === 'nuts' ? 'Hạt' : 
                               allergy === 'dairy' ? 'Sữa' : 
                               allergy === 'gluten' ? 'Gluten' : 
                               allergy === 'shellfish' ? 'Hải sản' : 
                               allergy === 'eggs' ? 'Trứng' : 
                               allergy === 'soy' ? 'Đậu nành' : 
                               allergy === 'fish' ? 'Cá' : allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p className="text-gray-600">Không có hạn chế dinh dưỡng</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4">Chọn tất cả những gì áp dụng:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {commonAllergies.map((allergy) => (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => handleAllergyToggle(allergy)}
                        className={`p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                          (editData.allergies || user.allergies || []).includes(allergy)
                            ? 'border-amber-500 bg-amber-100 text-amber-700 shadow-md'
                            : 'border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50 bg-white'
                        }`}
                      >
                        {allergy === 'nuts' && '🥜 Hạt'}
                        {allergy === 'dairy' && '🥛 Sữa'}
                        {allergy === 'gluten' && '🌾 Gluten'}
                        {allergy === 'shellfish' && '🦐 Hải sản'}
                        {allergy === 'eggs' && '🥚 Trứng'}
                        {allergy === 'soy' && '🫘 Đậu nành'}
                        {allergy === 'fish' && '🐟 Cá'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/order')}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-200 text-left group hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">Tạo Bowl Mới</h3>
            </div>
            <p className="text-gray-600 text-sm">Xây dựng bữa ăn cá nhân hóa</p>
          </button>

          <button
            onClick={() => router.push('/order-history')}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-200 text-left group hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">Lịch Sử Đơn Hàng</h3>
            </div>
            <p className="text-gray-600 text-sm">Xem đơn hàng & đặt lại</p>
          </button>

          <button
            onClick={() => router.push('/nutrition-insights')}
            className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-200 text-left group hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">Thống Kê Dinh Dưỡng</h3>
            </div>
            <p className="text-gray-600 text-sm">Theo dõi tiến trình của bạn</p>
          </button>
        </div>

        {/* Account Settings */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <svg className="w-7 h-7 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Cài Đặt Tài Khoản
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-6 rounded-2xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-left group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Thông Báo</p>
                  <p className="text-sm text-gray-600">Quản lý tùy chọn thông báo</p>
                </div>
              </div>
            </button>

            <button className="p-6 rounded-2xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-left group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Phương Thức Thanh Toán</p>
                  <p className="text-sm text-gray-600">Quản lý thẻ đã lưu</p>
                </div>
              </div>
            </button>

            <button className="p-6 rounded-2xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-left group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-lime-100 to-lime-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Địa Chỉ Giao Hàng</p>
                  <p className="text-sm text-gray-600">Quản lý địa chỉ văn phòng & nhà</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="p-6 rounded-2xl border border-red-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-red-600">Đăng Xuất</p>
                  <p className="text-sm text-red-500">Thoát khỏi tài khoản</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
