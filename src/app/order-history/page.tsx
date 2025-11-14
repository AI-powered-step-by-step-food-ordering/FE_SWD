'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import { formatVND } from '@/lib/format-number';

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
  const [totalPages, setTotalPages] = useState<number>(1);
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
        const response = await orderService.getOrderHistory(parsedUser.id, { page: currentPage - 1, size: pageSize, sortBy: 'createdAt', sortDir: 'desc' });

        if (response.success && response.data && Array.isArray(response.data.content)) {
          const mapped: Order[] = (response.data.content as any[]).map((o: any) => ({
            id: o.id,
            date: o.createdAt ? new Date((String(o.createdAt).length === 10 ? Number(o.createdAt) * 1000 : Number(o.createdAt))).toISOString() : new Date().toISOString(),
            totalPrice: Number(o.totalAmount ?? 0),
            status: String(o.status ?? 'UNKNOWN'),
          }));
          setOrders(mapped);
          setTotalPages(Math.max(1, Number(response.data.totalPages || 1)));
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
  }, [router, currentPage]);

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
  }, [paginatedOrders, FETCH_PAYMENT_METHODS]);

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
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg border-2 border-blue-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-900 mb-1">{orders.length}</p>
                <p className="text-sm font-medium text-blue-700">Total Orders</p>
              </div>
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                <i className="bx bx-package text-3xl text-blue-600"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg border-2 border-green-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-900 mb-1">
                  {formatVND(orders.reduce((sum, order) => sum + Math.round(order.totalPrice || 0), 0), false)}
                </p>
                <p className="text-sm font-medium text-green-700">Total Spent</p>
              </div>
              <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                <i className="bx bx-money text-3xl text-green-600"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-lg border-2 border-purple-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-900 mb-1">{orders.length ? 'Active' : '—'}</p>
                <p className="text-sm font-medium text-purple-700">Status</p>
              </div>
              <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center">
                <i className="bx bx-time text-3xl text-purple-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-12 text-center shadow-lg border-2 border-green-100">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="bx bx-bowl-rice text-5xl text-green-600"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Orders Yet</h2>
              <p className="text-gray-600 mb-8 text-lg">Start building your first healthy bowl!</p>
              <button
                onClick={() => router.push('/order')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
              >
                <i className="bx bx-plus-circle text-xl"></i>
                <span>Build Your First Bowl</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-green-300 hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">Order #{order.id.slice(0, 8)}...</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            <i className="bx bx-calendar text-base mr-1"></i>
                            {formatDate(order.date)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                          <span className="text-2xl font-bold text-green-700">
                            {formatVND(order.totalPrice || 0)}
                          </span>
                        </div>
                      </div>
                      
                      {orderIdToPaymentMethod[order.id] && (
                        <div className="mb-4 inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                          <i className="bx bx-credit-card text-base mr-1"></i>
                          {orderIdToPaymentMethod[order.id]}
                        </div>
                      )}
                      
                      <button
                        onClick={() => router.push(`/order-history/${order.id}`)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <i className="bx bx-detail text-xl"></i>
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8 flex items-center justify-between bg-white rounded-xl p-4 shadow-md">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    safePage === 1 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100 hover:shadow-md border border-gray-200'
                  }`}
                >
                  <i className="bx bx-chevron-left text-xl mr-1"></i>
                  Previous
                </button>
                <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                  Page <span className="text-green-600">{safePage}</span> of <span className="text-green-600">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    safePage === totalPages 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100 hover:shadow-md border border-gray-200'
                  }`}
                >
                  Next
                  <i className="bx bx-chevron-right text-xl ml-1"></i>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
