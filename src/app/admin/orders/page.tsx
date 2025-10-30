"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from '@/services/api.config';
import orderService from '@/services/order.service';
import bowlService from '@/services/bowl.service';
import paymentService from '@/services/payment.service';
import type { Order, Bowl, BowlItem, PaymentTransaction, Store, User } from "@/types/api";
import { toast } from "react-toastify";
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

export default function OrdersPage() {
  useRequireAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  
  // Modal state for order details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderBowls, setOrderBowls] = useState<Bowl[]>([]);
  const [bowlItems, setBowlItems] = useState<BowlItem[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: Order[] }>('/api/orders/getall');
      setOrders(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (order: Order) => {
    try {
      setOrderDetailsLoading(true);
      setSelectedOrder(order);
      setShowOrderModal(true);

      // Load bowls for this order
      const bowlsResponse = await bowlService.getAll();
      const orderBowls = bowlsResponse.data.filter(bowl => bowl.orderId === order.id);
      setOrderBowls(orderBowls);

      // Load bowl items for these bowls
      const bowlItemsResponse = await bowlService.getAllItems();
      const orderBowlItems = bowlItemsResponse.data.filter(item => 
        orderBowls.some(bowl => bowl.id === item.bowlId)
      );
      setBowlItems(orderBowlItems);

      // Load payment transactions for this order
      const paymentsResponse = await paymentService.getByOrderId(order.id);
      setPaymentTransactions(paymentsResponse.data);

    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    if (!confirm('Are you sure you want to confirm this order?')) return;
    try {
      const response = await apiClient.post<{ data: Order, message: string, success: boolean }>(`/api/orders/confirm/${id}`);
      if (response.data?.success && response.data?.data) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, status: response.data.data.status }
              : order,
          ),
        );
        toast.success('Order confirmed successfully');
      } else {
        toast.error(response.data?.message || 'Failed to confirm order');
      }
    } catch (error) {
      console.error('Failed to confirm order:', error);
      toast.error('Failed to confirm order');
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Are you sure you want to mark this order as completed?')) return;
    try {
      const response = await apiClient.post<{ data: Order, message: string, success: boolean }>(`/api/orders/complete/${id}`);
      if (response.data?.success && response.data?.data) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, status: response.data.data.status }
              : order,
          ),
        );
        toast.success('Order completed successfully');
      } else {
        toast.error(response.data?.message || 'Failed to complete order');
      }
    } catch (error) {
      console.error('Failed to complete order:', error);
      toast.error('Failed to complete order');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Enter cancellation reason (optional):');
    try {
      const response = await apiClient.post<{ data: Order, message: string, success: boolean }>(`/api/orders/cancel/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`);
      if (response.data?.success && response.data?.data) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, status: response.data.data.status }
              : order,
          ),
        );
        toast.success('Order cancelled successfully');
      } else {
        toast.error(response.data?.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const filteredOrders =
    filter === "ALL"
      ? orders
      : orders.filter((order) => order.status === filter);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "IN_KITCHEN":
        return "bg-purple-100 text-purple-800";
      case "READY_FOR_PICKUP":
        return "bg-indigo-100 text-indigo-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout title="Orders Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage all orders in the system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_KITCHEN">In Kitchen</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            "PENDING",
            "CONFIRMED",
            "IN_KITCHEN",
            "READY_FOR_PICKUP",
            "COMPLETED",
            "CANCELLED",
          ].map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <div key={status} className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-gray-600">
                  {status.replace("_", " ")}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Orders Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Store ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">
                          {order.id || "N/A"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-mono text-sm text-gray-600">
                          {order.userId?.slice(0, 8) || "N/A"}...
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-mono text-sm text-gray-600">
                          {order.storeId?.slice(0, 8) || "N/A"}...
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="text-sm text-gray-900">
                          ${order.subtotalAmount?.toFixed(2) || "0.00"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="text-sm text-green-600">
                          -${order.promotionTotal?.toFixed(2) || "0.00"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          ${order.totalAmount?.toFixed(2) || "0.00"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => loadOrderDetails(order)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Order Details"
                          >
                            👁
                          </button>
                          {order.status === "PENDING" && (
                            <button
                              onClick={() => handleConfirm(order.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Confirm Order"
                            >
                              ✓
                            </button>
                          )}
                          {(order.status === "CONFIRMED" ||
                            order.status === "IN_KITCHEN" ||
                            order.status === "READY_FOR_PICKUP") && (
                            <button
                              onClick={() => handleComplete(order.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Complete Order"
                            >
                              ✓✓
                            </button>
                          )}
                          {order.status !== "COMPLETED" &&
                            order.status !== "CANCELLED" && (
                              <button
                                onClick={() => handleCancel(order.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel Order"
                              >
                                ✕
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Details - {selectedOrder.id}
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {orderDetailsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2">Loading order details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Basic Order Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Order ID:</span>
                      <p className="font-mono text-sm">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">User ID:</span>
                      <p className="font-mono text-sm">{selectedOrder.userId}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Store ID:</span>
                      <p className="font-mono text-sm">{selectedOrder.storeId}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Pickup Time:</span>
                      <p className="text-sm">{selectedOrder.pickupAt ? new Date(selectedOrder.pickupAt).toLocaleString() : 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Created:</span>
                      <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedOrder.note && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-600">Note:</span>
                      <p className="text-sm bg-white p-2 rounded border">{selectedOrder.note}</p>
                    </div>
                  )}
                </div>

                {/* Order Totals */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Order Totals</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-${selectedOrder.promotionTotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Bowls */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Bowls ({orderBowls.length})</h3>
                  {orderBowls.length === 0 ? (
                    <p className="text-gray-500">No bowls found for this order.</p>
                  ) : (
                    <div className="space-y-4">
                      {orderBowls.map((bowl) => (
                        <div key={bowl.id} className="bg-white p-4 rounded border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{bowl.name}</h4>
                              <p className="text-sm text-gray-600 font-mono">Bowl ID: {bowl.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${bowl.totalPrice?.toFixed(2) || '0.00'}</p>
                              <p className="text-sm text-gray-600">Qty: {bowl.quantity || 1}</p>
                            </div>
                          </div>
                          
                          {/* Bowl Items */}
                          <div className="mt-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Ingredients:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {bowlItems
                                .filter(item => item.bowlId === bowl.id)
                                .map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                    <span>{item.ingredientId}</span>
                                    <span>Qty: {item.quantity}</span>
                                  </div>
                                ))}
                            </div>
                            {bowlItems.filter(item => item.bowlId === bowl.id).length === 0 && (
                              <p className="text-sm text-gray-500">No ingredients found.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Transactions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Payment Transactions ({paymentTransactions.length})</h3>
                  {paymentTransactions.length === 0 ? (
                    <p className="text-gray-500">No payment transactions found for this order.</p>
                  ) : (
                    <div className="space-y-3">
                      {paymentTransactions.map((payment) => (
                        <div key={payment.id} className="bg-white p-4 rounded border">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="text-sm text-gray-600">Transaction ID:</span>
                              <p className="font-mono text-sm">{payment.id}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Amount:</span>
                              <p className="font-semibold">${payment.amount?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Status:</span>
                              <p className="text-sm">{payment.status || 'Unknown'}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Method:</span>
                              <p className="text-sm">{payment.paymentMethod || 'Unknown'}</p>
                            </div>
                          </div>
                          {payment.transactionId && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">External Transaction ID:</span>
                              <p className="font-mono text-sm">{payment.transactionId}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
