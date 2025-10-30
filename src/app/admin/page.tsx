'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import apiClient from '@/services/api.config';
import Link from 'next/link';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, orders, ingredients, promotions] = await Promise.all([
        apiClient.get('/api/users/getall'),
        apiClient.get('/api/orders/getall'),
        apiClient.get('/api/ingredients/getall'),
        apiClient.get('/api/promotions/getall'),
      ]);

      setStats({
        totalUsers: users.data?.data?.length || 0,
        totalOrders: orders.data?.data?.length || 0,
        totalIngredients: ingredients.data?.data?.length || 0,
        totalPromotions: promotions.data?.data?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: '📋',
      color: 'bg-green-500',
      link: '/admin/orders',
    },
    {
      title: 'Total Ingredients',
      value: stats.totalIngredients,
      icon: '🥕',
      color: 'bg-yellow-500',
      link: '/admin/ingredients',
    },
    {
      title: 'Total Promotions',
      value: stats.totalPromotions,
      icon: '🎁',
      color: 'bg-purple-500',
      link: '/admin/promotions',
    },
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
                <div className={`${stat.color} rounded-full p-3 text-2xl`}>
                  {stat.icon}
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Add Promotion</p>
                <p className="text-sm text-gray-500">Create new promotion</p>
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
