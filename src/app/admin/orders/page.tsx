"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiClient } from "@/lib/api";
import type { Order } from "@/types/api";
import { toast } from "react-toastify";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAll<Order>("orders");
      setOrders(response.data || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    if (!confirm("Are you sure you want to confirm this order?")) return;
    try {
      const response = await apiClient.confirmOrder(id);
      if (response.success && response.data) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, status: response.data.status }
              : order,
          ),
        );
        toast.success("Order confirmed successfully");
      } else {
        toast.error(response.message || "Failed to confirm order");
      }
    } catch (error) {
      console.error("Failed to confirm order:", error);
      toast.error("Failed to confirm order");
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Are you sure you want to mark this order as completed?"))
      return;
    try {
      const response = await apiClient.completeOrder(id);
      if (response.success && response.data) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, status: response.data.status }
              : order,
          ),
        );
        toast.success("Order completed successfully");
      } else {
        toast.error(response.message || "Failed to complete order");
      }
    } catch (error) {
      console.error("Failed to complete order:", error);
      toast.error("Failed to complete order");
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt("Enter cancellation reason (optional):");
    try {
      const response = await apiClient.cancelOrder(id, reason || undefined);
      if (response.success && response.data) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, status: response.data.status }
              : order,
          ),
        );
        toast.success("Order cancelled successfully");
      } else {
        toast.error(response.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error("Failed to cancel order");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      await apiClient.delete("orders", id);
      toast.success("Order deleted successfully");
      loadOrders();
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("Failed to delete order");
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
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Delete Order"
                          >
                            🗑
                          </button>
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
    </AdminLayout>
  );
}
