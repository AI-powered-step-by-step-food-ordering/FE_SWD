"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const menuItems = [
  { title: 'Dashboard', iconClass: 'bx-grid-alt', href: '/admin' },
  { title: 'Users', iconClass: 'bx-user', href: '/admin/users' },
  { title: 'Orders', iconClass: 'bx-receipt', href: '/admin/orders' },
  { title: 'Ingredients', iconClass: 'bx-lemon', href: '/admin/ingredients' },
  { title: 'Categories', iconClass: 'bx-category', href: '/admin/categories' },
  { title: 'Promotions', iconClass: 'bx-gift', href: '/admin/promotions' },
  { title: 'Stores', iconClass: 'bx-store', href: '/admin/stores' },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, hydrateFromCookies } = useAuthStore();

  // Ensure store is hydrated so sidebar shows real user info after login
  useEffect(() => {
    hydrateFromCookies?.();
  }, [hydrateFromCookies]);

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">🥗</span>
                <span className="text-xl font-semibold text-gray-800">Admin Panel</span>
              </Link>
              {/* Return to homepage icon */}
              <Link
                href="/"
                className="text-gray-500 hover:text-green-600"
                aria-label="Switch"
                title="Switch"
              >
                <i className="bx bx-transfer text-[22px]" aria-hidden="true"></i>
              </Link>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
              aria-label="Close sidebar"
            >
              <i className="bx bx-x text-[24px]"></i>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-green-50 text-green-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <i className={`bx ${item.iconClass} text-[20px]`}></i>
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 font-semibold">
                {(user?.fullName?.[0] || user?.email?.[0] || 'A')?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{user?.fullName || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
