'use client';

import { useEffect, useState, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { userService, orderService, ingredientService, promotionService } from '@/services';

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalIngredients: number;
  totalPromotions: number;
}

export default function AdminDashboard() {
  useRequireAdmin();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOrders: 0,
    totalIngredients: 0,
    totalPromotions: 0,
  });
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Guard against double-invocation in React Strict Mode (dev)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Use service endpoints aligned with backend; read totalElements for paginated resources
      const [usersRes, ordersRes, ingredientsRes, promotionsRes] = await Promise.allSettled([
        userService.getAll({ page: 0, size: 1 }),
        orderService.getAll({ page: 0, size: 10 }).catch(err => {
          console.error('Failed to load orders for stats:', err);
          return { success: false, data: { totalElements: 0 } } as any;
        }),
        ingredientService.getAll({ page: 0, size: 1 }),
        promotionService.getAll(),
      ]);

      // Extract values from settled promises
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : null;
      const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value : null;
      const ingredientsData = ingredientsRes.status === 'fulfilled' ? ingredientsRes.value : null;
      const promotionsData = promotionsRes.status === 'fulfilled' ? promotionsRes.value : null;

      setStats({
        totalUsers: usersData?.data?.totalElements ?? 0,
        totalOrders: ordersData?.data?.totalElements ?? 0,
        totalIngredients: ingredientsData?.data?.totalElements ?? 0,
        totalPromotions: Array.isArray(promotionsData?.data) ? promotionsData.data.length : 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, iconClass: 'bx-user', color: 'bg-blue-500', link: '/admin/users' },
    { title: 'Total Orders', value: stats.totalOrders, iconClass: 'bx-receipt', color: 'bg-green-500', link: '/admin/orders' },
    { title: 'Total Ingredients', value: stats.totalIngredients, iconClass: 'bx-lemon', color: 'bg-yellow-500', link: '/admin/ingredients' },
    { title: 'Total Promotions', value: stats.totalPromotions, iconClass: 'bx-gift', color: 'bg-purple-500', link: '/admin/promotions' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              href={stat.link}
              className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} rounded-full p-3 text-2xl text-white`}>
                  <i className={`bx ${stat.iconClass}`}></i>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <i className="bx bx-user-plus text-[24px]"></i>
              </div>
              <div>
                <p className="font-medium text-gray-800">Add User</p>
                <p className="text-sm text-gray-500">Create new user</p>
              </div>
            </Link>

            <Link
              href="/admin/ingredients"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <i className="bx bx-plus text-[24px]"></i>
              </div>
              <div>
                <p className="font-medium text-gray-800">Add Ingredient</p>
                <p className="text-sm text-gray-500">Create new ingredient</p>
              </div>
            </Link>

            <Link
              href="/admin/promotions"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <i className="bx bx-gift text-[24px]"></i>
              </div>
              <div>
                <p className="font-medium text-gray-800">Add Promotion</p>
                <p className="text-sm text-gray-500">Create new promotion</p>
              </div>
            </Link>

            <Link
              href="/admin/bowl-templates"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <i className="bx bx-grid-alt text-[24px]"></i>
              </div>
              <div>
                <p className="font-medium text-gray-800">Manage Bowl Templates</p>
                <p className="text-sm text-gray-500">CRUD for template & steps</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to HealthyBowl Admin Panel!</h2>
          <p className="text-green-50">
            Manage your healthy food ordering system from this dashboard. You can manage users, orders, ingredients, categories, promotions, and stores.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
