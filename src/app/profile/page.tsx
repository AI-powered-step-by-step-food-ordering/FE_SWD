'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import AuthError from '@/components/shared/AuthError';
import { userService } from '@/services';
import { User, UserUpdateRequest } from '@/types/api.types';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserUpdateRequest>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('upload');
    const [orderCount, setOrderCount] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [lastOrderAt, setLastOrderAt] = useState<string | null>(null);

  const onPickFile = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl) handleInputChange('imageUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const loadOrderStats = async (uid: string) => {
    try {
      const { orderService } = await import('@/services');
      const res = await orderService.getAll();
      if (res.success && Array.isArray(res.data)) {
        const myOrders = res.data.filter(o => o.userId === uid);
        setOrderCount(myOrders.length);
        const total = myOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        setTotalSpent(total);
        const last = myOrders
          .map(o => o.createdAt)
          .filter(Boolean)
          .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0] || null;
        setLastOrderAt(last as string | null);
      }
    } catch (e) {
      console.error('Failed to load order stats', e);
    }
  };


  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = document.cookie.split(';').find(c => c.trim().startsWith('accessToken='))?.split('=')[1];
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Get user from storage first to get user id
      const userFromStorage = document.cookie.split(';').find(c => c.trim().startsWith('user='))?.split('=')[1];
      if (!userFromStorage) {
        setError('User not found. Please login again.');
        return;
      }

      const parsedUser = JSON.parse(decodeURIComponent(userFromStorage));
      
      // Try to get user by ID from API
      try {
        const response = await userService.getById(parsedUser.id);
        if (response.success) {
          setUser(response.data);
          setEditData({
            fullName: response.data.fullName,
            email: response.data.email,
            goalCode: response.data.goalCode,
            imageUrl: response.data.imageUrl || '',
            dateOfBirth: response.data.dateOfBirth || '',
            address: response.data.address || '',
            phone: response.data.phone || ''
          });
          // Load real order stats
          await loadOrderStats(response.data.id);
        } else {
          // Fallback to stored user data
          setUser(parsedUser);
          setEditData({
            fullName: parsedUser.fullName || parsedUser.name,
            email: parsedUser.email,
            goalCode: parsedUser.goalCode,
            imageUrl: parsedUser.imageUrl || '',
            dateOfBirth: parsedUser.dateOfBirth || '',
            address: parsedUser.address || '',
            phone: parsedUser.phone || ''
          });
          await loadOrderStats(parsedUser.id);
        }
      } catch (apiError) {
        console.log('API getById failed, using stored user data');
        // Fallback to stored user data
        setUser(parsedUser);
        setEditData({
          fullName: parsedUser.fullName || parsedUser.name,
          email: parsedUser.email,
          goalCode: parsedUser.goalCode,
          imageUrl: parsedUser.imageUrl || '',
          dateOfBirth: parsedUser.dateOfBirth || '',
          address: parsedUser.address || '',
          phone: parsedUser.phone || ''
        });
        await loadOrderStats(parsedUser.id);
      }
    } catch (err) {
      setError('Failed to load user profile. Please try logging in again.');
      console.error('Error loading user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeDateToISO = (value?: string) => {
    if (!value) return undefined;
    // If only date provided: YYYY-MM-DD -> normalize to midnight UTC with Z
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + 'T00:00:00Z').toISOString();
    }
    // If missing seconds: YYYY-MM-DDTHH:MM -> add seconds and Z
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return new Date(value + ':00Z').toISOString();
    }
    // If ISO without Z (local), add Z
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
      return new Date(value + 'Z').toISOString();
    }
    // Assume valid ISO -> pass through
    try {
      return new Date(value).toISOString();
    } catch (_) {
      return undefined;
    }
  };

  const handleSave = async () => {
    if (user && editData) {
      try {
        const payload = { ...editData } as UserUpdateRequest;
        if (payload.dateOfBirth) {
          const normalized = normalizeDateToISO(payload.dateOfBirth);
          if (normalized) {
            payload.dateOfBirth = normalized;
          }
        }
        const response = await userService.update(user.id, payload);
        if (response.success) {
          setUser(response.data);
          setIsEditing(false);
          setError('');
          
          // Update stored user data
          document.cookie = `user=${encodeURIComponent(JSON.stringify(response.data))};path=/;SameSite=Lax`;
          toast.success('Cập nhật hồ sơ thành công!');
        } else {
          setError('Failed to update profile');
          toast.error(response.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.');
        }
      } catch (err) {
        setError('Failed to update profile');
        console.error('Error updating profile:', err);
        toast.error('Có lỗi khi cập nhật hồ sơ. Vui lòng thử lại.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      const { authService } = await import('@/services');
      await authService.logout();
      router.push('/');
    } catch (error) {
      // Even if API call fails, still redirect to home
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  const handleInputChange = (field: keyof UserUpdateRequest, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getGoalEmoji = (goalCode?: string) => {
    switch (goalCode) {
      case 'LOSE_WEIGHT': return '🔥';
      case 'MAINTAIN_WEIGHT': return '⚖️';
      case 'GAIN_WEIGHT': return '💪';
      case 'BUILD_MUSCLE': return '🏋️‍♂️';
      default: return '⚖️';
    }
  };

  const getGoalName = (goalCode?: string) => {
    switch (goalCode) {
      case 'LOSE_WEIGHT': return 'Giảm Cân';
      case 'MAINTAIN_WEIGHT': return 'Duy Trì Cân Nặng';
      case 'GAIN_WEIGHT': return 'Tăng Cân';
      case 'BUILD_MUSCLE': return 'Xây Dựng Cơ Bắp';
      default: return 'Duy Trì Cân Nặng';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !user) {
    return <AuthError message={error} onRetry={loadUserProfile} />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
              <div className="flex items-center space-x-6 mb-6 lg:mb-0">
              <div className="relative">
                {user.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName}
                    className="w-20 h-20 rounded-full object-cover shadow-xl border-4 border-white"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-xl">
                    <span className="text-3xl font-bold text-white">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{user.fullName}</h1>
                <p className="text-gray-600 mb-1">{user.email}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {user.phone && (
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      <span>{user.phone}</span>
                    </span>
                  )}
                  {user.dateOfBirth && (
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span>DOB: {new Date(user.dateOfBirth).toLocaleDateString()}</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setEditData({
                    fullName: user.fullName,
                    email: user.email,
                    goalCode: user.goalCode,
                    imageUrl: user.imageUrl || '',
                    dateOfBirth: user.dateOfBirth || '',
                    address: user.address || '',
                    phone: user.phone || '',
                    gender: user.gender || ''
                  });
                  setIsEditing(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Chỉnh sửa
              </button>
            </div>
          </div>

          {/* Profile Stats - real data only */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{orderCount}</div>
              <div className="text-sm text-blue-700">Đơn hàng đã tạo</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{totalSpent.toLocaleString('vi-VN')}₫</div>
              <div className="text-sm text-green-700">Tổng đã chi</div>
            </div>
            {lastOrderAt && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">{new Date(lastOrderAt).toLocaleDateString('vi-VN')}</div>
                <div className="text-sm text-emerald-700">Đơn gần nhất</div>
              </div>
            )}
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
              
              {
                (
                <div className="space-y-4">
                  <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getGoalEmoji(user.goalCode)}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{getGoalName(user.goalCode)}</p>
                        <p className="text-sm text-gray-600">Mục tiêu hiện tại</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Personal Information Display */}
                  {(user.gender || user.address || user.phone || user.dateOfBirth) && (
                    <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin cá nhân</h3>
                      <div className="space-y-2 text-sm">
                        {user.gender && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Giới tính:</span>
                            <span className="font-medium text-gray-900">
                              {user.gender === 'MALE' ? '♂ Nam' : user.gender === 'FEMALE' ? '♀ Nữ' : '⚧ Khác'}
                            </span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Điện thoại:</span>
                            <span className="font-medium text-gray-900">{user.phone}</span>
                          </div>
                        )}
                        {user.dateOfBirth && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Ngày sinh:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(user.dateOfBirth).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        )}
                        {user.address && (
                          <div className="flex items-start space-x-2">
                            <span className="text-gray-500">Địa chỉ:</span>
                            <span className="font-medium text-gray-900 flex-1">{user.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                </div>
              )}
            </div>

            {/* Order Statistics */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Thống kê đơn hàng
              </h2>
              
              <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                {orderCount > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Số đơn</p>
                      <p className="text-lg font-semibold text-gray-900">{orderCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tổng chi</p>
                      <p className="text-lg font-semibold text-gray-900">{totalSpent.toLocaleString('vi-VN')}₫</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Gần nhất</p>
                      <p className="text-lg font-semibold text-gray-900">{lastOrderAt ? new Date(lastOrderAt).toLocaleDateString('vi-VN') : '—'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <p className="text-gray-600">Chưa có đơn hàng để thống kê</p>
                  </div>
                )}
              </div>
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
        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md mx-auto transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">My profile</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Avatar: hover/click to pick file + single URL input */}
                <div className="flex items-center space-x-4">
                  <div
                    className={`relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer group`}
                    onClick={onPickFile}
                    title={'Click để chọn ảnh'}
                  >
                    {editData.imageUrl || user.imageUrl ? (
                      <img
                        src={editData.imageUrl || user.imageUrl || ''}
                        alt={editData.fullName || user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {(editData.fullName || user.fullName).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                      <svg
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 text-white transition-opacity"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      placeholder="Dán URL hình ảnh (https://...)"
                      value={editData.imageUrl || ''}
                      onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                    />
                    <p className="mt-2 text-xs text-gray-500">Dán URL hoặc hover/click vào avatar để chọn ảnh từ máy.</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>

                {/* Compact 2-column form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                    <input
                      type="text"
                      value={editData.fullName || user.fullName || ''}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editData.email || user.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>

                  {/* Phone number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      value={editData.phone || user.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="0123456789"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                    <input
                      type="date"
                      value={editData.dateOfBirth ? new Date(editData.dateOfBirth).toISOString().split('T')[0] : (user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '')}
                      onChange={(e) => {
                        const dateValue = e.target.value ? new Date(e.target.value + 'T00:00:00').toISOString() : '';
                        handleInputChange('dateOfBirth', dateValue);
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                    />
                  </div>

                  {/* Goal */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mục tiêu</label>
                    <select
                      value={editData.goalCode || user.goalCode || 'MAINTAIN_WEIGHT'}
                      onChange={(e) => handleInputChange('goalCode', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="MAINTAIN_WEIGHT">⚖️ Duy trì cân nặng</option>
                      <option value="LOSE_WEIGHT">🔥 Giảm cân</option>
                      <option value="GAIN_WEIGHT">💪 Tăng cân</option>
                      <option value="BUILD_MUSCLE">🏋️‍♂️ Tăng cơ</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                    <textarea
                      value={editData.address || user.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Nhập địa chỉ của bạn"
                      rows={2}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      fullName: user.fullName,
                      email: user.email,
                      goalCode: user.goalCode,
                      imageUrl: user.imageUrl || '',
                      dateOfBirth: user.dateOfBirth || '',
                      address: user.address || '',
                      phone: user.phone || '',
                      gender: user.gender || ''
                    });
                  }}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
