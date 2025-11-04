'use client';

import { useState, useEffect } from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useAuthStore } from '@/store/auth.store';
import { clearAuthCookies, isAuthenticatedViaCookie, getStoredUser } from '@/lib/auth-utils';
import { authService } from '@/services';
import { formatVND } from '@/lib/format-number';

interface HeaderProps {
  totalPrice?: number;
  totalCalories?: number;
  showPriceInfo?: boolean;
}

export default function Header({ totalPrice = 0, totalCalories = 0, showPriceInfo = false }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { navigateWithLoading } = usePageLoading();
  const hydrateFromCookies = useAuthStore(s => s.hydrateFromCookies);
  const storeUser = useAuthStore(s => s.user);
  const storeIsAuth = useAuthStore(s => s.isAuthenticated);
  const clearStore = useAuthStore(s => s.clear);

  const handleOrderNavigation = () => {
    const authed = isAuthenticatedViaCookie();
    const u = getStoredUser();
    if (!authed || !u) {
      // Redirect to login with order redirect param
      navigateWithLoading('/auth/login?from=order');
    } else {
      // Navigate to order page if authenticated
      navigateWithLoading('/order');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch { /* ignore error */ }
    clearStore();
    clearAuthCookies();
    navigateWithLoading('/auth/login');
  };

  useEffect(() => {
    hydrateFromCookies();
  }, [hydrateFromCookies]);

  useEffect(() => {
    setUser(storeUser);
    setIsAuthenticated(storeIsAuth);
  }, [storeUser, storeIsAuth]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close mobile menu
      if (isMobileMenuOpen) {
        const mobileMenuBtn = document.querySelector('#mobileMenuBtn');
        const mobileMenuDropdown = document.querySelector('#mobileMenuDropdown');
        
        if (mobileMenuBtn && mobileMenuDropdown && 
            !mobileMenuBtn.contains(target) && 
            !mobileMenuDropdown.contains(target)) {
          setIsMobileMenuOpen(false);
        }
      }
      
      // Close profile dropdown
      if (isProfileDropdownOpen) {
        const profileBtn = document.querySelector('#profileBtn');
        const profileDropdown = document.querySelector('#profileDropdown');
        
        if (profileBtn && profileDropdown && 
            !profileBtn.contains(target) && 
            !profileDropdown.contains(target)) {
          setIsProfileDropdownOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen, isProfileDropdownOpen]);

  return (
    <header className="bg-gradient-to-r from-white/95 via-green-50/95 to-white/95 backdrop-blur-md shadow-lg border-b border-green-100/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning={true}>
        <div className="flex justify-between items-center py-3" suppressHydrationWarning={true}>
          {/* Logo */}
          <div className="flex items-center" suppressHydrationWarning={true}>
            <button onClick={() => navigateWithLoading('/')} className="flex items-center space-x-2 group">
              <span className="text-2xl">🥗</span>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
                Healthy Bowl
              </h1>
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            id="mobileMenuBtn"
            onClick={toggleMobileMenu}
            className="md:hidden relative p-3 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg border border-green-100 text-gray-600 hover:text-green-600 hover:bg-green-50/80 transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              )}
            </svg>
          </button>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button onClick={() => navigateWithLoading('/')} className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-white/60 rounded-lg transition-all duration-300 text-sm lg:text-base font-semibold hover:scale-105 hover:shadow-md backdrop-blur-sm">Home</button>
            {/* <a href="#plans" className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-white/60 rounded-lg transition-all duration-300 text-sm lg:text-base font-semibold hover:scale-105 hover:shadow-md backdrop-blur-sm">Our Subscriptions</a> */}
            <button onClick={() => navigateWithLoading('/about')} className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-white/60 rounded-lg transition-all duration-300 text-sm lg:text-base font-semibold hover:scale-105 hover:shadow-md backdrop-blur-sm">About Us</button>
            <button onClick={() => navigateWithLoading('/contact')} className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-white/60 rounded-lg transition-all duration-300 text-sm lg:text-base font-semibold hover:scale-105 hover:shadow-md backdrop-blur-sm">Contact Us</button>
            <button onClick={handleOrderNavigation} className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-white/60 rounded-lg transition-all duration-300 text-sm lg:text-base font-semibold hover:scale-105 hover:shadow-md backdrop-blur-sm">Order Now</button>
          </nav>
          
          {/* User Menu / Cart */}
          <div className="flex items-center space-x-3" suppressHydrationWarning={true}>
            {/* Cart Icon - Only show when authenticated */}
            {isAuthenticated && user && (
              <div className="relative group" suppressHydrationWarning={true}>
                <button onClick={handleOrderNavigation} className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-green-100 text-gray-700 hover:text-green-600 hover:bg-green-50/80 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <div className="relative" suppressHydrationWarning={true}>
                    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M15 15.75a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">0</span>
                  </div>
                  {showPriceInfo ? (
                    <div className="hidden sm:block text-right" suppressHydrationWarning={true}>
                      <div className="font-semibold text-sm lg:text-base text-green-600" suppressHydrationWarning={true}>{formatVND(totalPrice)}</div>
                      <div className="text-xs text-gray-600" suppressHydrationWarning={true}>{totalCalories} kcal</div>
                    </div>
                  ) : (
                    <span className="hidden sm:block font-semibold text-sm lg:text-base">{formatVND(0)}</span>
                  )}
                </button>
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400/20 to-green-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" suppressHydrationWarning={true}></div>
              </div>
            )}

            {/* User Profile / Login */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button 
                  id="profileBtn"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg border-2 border-white overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200"
                >
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user.fullName || user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-green-600">
                      {(user.fullName || user.name || 'U')?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>
                
                {/* Dropdown Menu */}
                <div 
                  id="profileDropdown"
                  className={`absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 transition-all duration-200 z-50 ${
                    isProfileDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}
                >
                  <div className="py-2">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.fullName || user.name}</p>
                      {/* <p className="text-xs text-gray-500">{user.email}</p> */}
                    </div>
                    
                    {/* Menu Items */}
                    <button 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        navigateWithLoading('/profile');
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors w-full text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      <span>Profile</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        navigateWithLoading('/order-history');
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors w-full text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                      <span>Order History</span>
                    </button>
                    
                    {user?.role?.toUpperCase() === 'ADMIN' && (
                      <button 
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigateWithLoading('/admin');
                        }}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors w-full text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>Admin Panel</span>
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        setIsProfileDropdownOpen(false);
                        await handleLogout();
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full text-left border-t border-gray-100 mt-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7"></path>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => navigateWithLoading('/auth/login')} className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl">
                Sign In
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        <div id="mobileMenuDropdown" className={`md:hidden absolute left-0 right-0 top-full bg-white/95 backdrop-blur-md border-t border-green-100 shadow-2xl transition-all duration-300 ${isMobileMenuOpen ? 'block' : 'hidden'}`} suppressHydrationWarning={true}>
          <div className="max-w-7xl mx-auto px-4 py-6" suppressHydrationWarning={true}>
            <div className="flex flex-col space-y-2" suppressHydrationWarning={true}>
              <button onClick={() => { setIsMobileMenuOpen(false); navigateWithLoading('/'); }} className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50/80 rounded-lg transition-all duration-300 text-base font-semibold w-full text-left">🏠 Home</button>
              <a href="#plans" className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50/80 rounded-lg transition-all duration-300 text-base font-semibold" onClick={() => setIsMobileMenuOpen(false)}>📦 Our Subscriptions</a>
              <a className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50/80 rounded-lg transition-all duration-300 text-base font-semibold" href="#about" onClick={() => setIsMobileMenuOpen(false)}>ℹ️ About Us</a>
              <a className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50/80 rounded-lg transition-all duration-300 text-base font-semibold" href="#contact" onClick={() => setIsMobileMenuOpen(false)}>📞 Contact Us</a>
              <button onClick={() => { setIsMobileMenuOpen(false); handleOrderNavigation(); }} className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50/80 rounded-lg transition-all duration-300 text-base font-semibold w-full text-left">🥗 Order Now</button>
              
              {/* User Section */}
              {isAuthenticated && user ? (
                <>
                  <hr className="my-2" />
                  <div className="px-4 py-2">
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                  </div>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigateWithLoading('/profile'); }} className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50/80 rounded-lg transition-all duration-300 text-base font-semibold w-full text-left">👤 Profile</button>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigateWithLoading('/order-history'); }} className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50/80 rounded-lg transition-all duration-300 text-base font-semibold w-full text-left">📋 Order History</button>
                  {user?.role?.toUpperCase() === 'ADMIN' && (
                    <button onClick={() => { setIsMobileMenuOpen(false); navigateWithLoading('/admin'); }} className="px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50/80 rounded-lg transition-all duration-300 text-base font-semibold w-full text-left">⚙️ Admin Panel</button>
                  )}
                </>
              ) : (
                <>
                  <hr className="my-2" />
                  <button onClick={() => { setIsMobileMenuOpen(false); navigateWithLoading('/auth/login'); }} className="px-4 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all duration-300 text-base font-semibold text-center">🔑 Sign In</button>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigateWithLoading('/auth/register'); }} className="px-4 py-3 text-green-600 hover:text-green-700 hover:bg-green-50/80 rounded-lg transition-all duration-300 text-base font-semibold text-center">📝 Sign Up</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
