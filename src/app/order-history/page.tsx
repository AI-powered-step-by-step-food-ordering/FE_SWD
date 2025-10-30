'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';

interface Order {
  id: string;
  date: string; // ISO string for display
  totalPrice: number;
  status: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8; // items per page
  const [orderIdToPaymentMethod, setOrderIdToPaymentMethod] = useState<Record<string, string>>({});
  const FETCH_PAYMENT_METHODS = false; // enable when /payment_transactions/getbyorder is stable

  useEffect(() => {
    const fetchOrders = async () => {
      const userData = document.cookie.split(';').find(c => c.trim().startsWith('user='))?.split('=')[1];
      const isAuth = document.cookie.includes('isAuthenticated=true') ? 'true' : 'false';
      
      if (!isAuth || !userData) {
        router.push('/auth/login');
        return;
      }
      
      let parsedUser: any = null;
      try {
        parsedUser = JSON.parse(decodeURIComponent(userData));
      } catch {
        parsedUser = JSON.parse(userData);
      }
      setUser(parsedUser);
      
      try {
        // Fetch user's order history from API
        const { orderService } = await import('@/services');
        const response = await orderService.getOrderHistory(parsedUser.id);
        
        if (response.success && response.data) {
          const mapped: Order[] = (response.data as any[]).map((o: any) => ({
            id: o.id,
            date: o.createdAt ? new Date((String(o.createdAt).length === 10 ? Number(o.createdAt) * 1000 : Number(o.createdAt))).toISOString() : new Date().toISOString(),
            totalPrice: Number(o.totalAmount ?? 0),
            status: String(o.status ?? 'UNKNOWN'),
          }));
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      }
      
      setIsLoading(false);
    };

    fetchOrders();
  }, [router]);

  const handleReorder = (order: Order) => {
    router.push('/order');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PREPARING': return 'text-yellow-600 bg-yellow-100';
      case 'CONFIRMED': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedOrders = orders.slice(startIdx, endIdx);

  // Fetch payment method for orders on current page (best-effort)
  useEffect(() => {
    if (!FETCH_PAYMENT_METHODS) return;
    const fetchMethods = async () => {
      try {
        const { paymentService } = await import('@/services');
        const results = await Promise.allSettled(
          paginatedOrders.map((o) => paymentService.getByOrderId(o.id))
        );
        const mapping: Record<string, string> = {};
        results.forEach((res, idx) => {
          const o = paginatedOrders[idx];
          if (res.status === 'fulfilled' && res.value?.success && Array.isArray(res.value.data)) {
            const payments = res.value.data as any[];
            const latest = payments[0];
            if (latest?.method) mapping[o.id] = String(latest.method);
          }
        });
        if (Object.keys(mapping).length) {
          setOrderIdToPaymentMethod((prev) => ({ ...prev, ...mapping }));
        }
      } catch {}
    };
    if (paginatedOrders.length) fetchMethods();
  }, [paginatedOrders]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">Your past orders and quick reorder options</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toLocaleString('vi-VN')} đ
                </p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🕒</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orders.length ? 'Active' : '—'}</p>
                <p className="text-sm text-gray-600">Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <span className="text-6xl mb-4 block">🥗</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
              <p className="text-gray-600 mb-6">Start building your first healthy bowl!</p>
              <button
                onClick={() => router.push('/order')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Build Your First Bowl
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatDate(order.date)}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">Total: {Number(order.totalPrice || 0).toLocaleString('vi-VN')} đ</div>
                      {orderIdToPaymentMethod[order.id] && (
                        <div className="mt-2 text-xs inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Method: {orderIdToPaymentMethod[order.id]}
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex gap-3">
                      <button
                        onClick={() => router.push(`/order-history/${order.id}`)}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                      >
                        📋 View Details
                      </button>
                      <button
                        onClick={() => handleReorder(order)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        ⚡ Reorder
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className={`px-4 py-2 rounded-lg border ${safePage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  ← Prev
                </button>
                <div className="text-sm text-gray-600">
                  Page {safePage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className={`px-4 py-2 rounded-lg border ${safePage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/order')}
              className="p-4 border-2 border-green-200 rounded-lg hover:border-green-300 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🥗</span>
                <div>
                  <p className="font-medium text-gray-900">Build New Bowl</p>
                  <p className="text-sm text-gray-600">Create a fresh personalized meal</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-gray-900">Nutrition Insights</p>
                  <p className="text-sm text-gray-600">View your eating patterns</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
