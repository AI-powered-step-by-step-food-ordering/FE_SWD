"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/services/api.config";
import orderService from "@/services/order.service";
// Removed bowlService/paymentService imports; order details now fetched via orderService.getById
import type { Order, Bowl, BowlItem, Store, User } from "@/types/api.types";
import { toast } from "react-toastify";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { formatVND } from "@/lib/format-number";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import Pagination from "@/components/admin/Pagination";

export default function OrdersPage() {
  useRequireAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [useLegacy, setUseLegacy] = useState(false);

  // Modal state for order details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderBowls, setOrderBowls] = useState<Bowl[]>([]);
  const [bowlItems, setBowlItems] = useState<BowlItem[]>([]);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Load orders with backend pagination
  const loadOrders = async () => {
    try {
      setLoading(true);
      const q = search.trim().toLowerCase();

      // If legacy fallback is enabled, use legacy endpoint and paginate client-side
      if (useLegacy) {
        const legacy = await orderService.getAllLegacy();
        if (legacy.success && legacy.data) {
          let list = legacy.data;
          // Apply status filter
          if (filter !== "ALL") {
            list = list.filter((o) => o.status === filter);
          }
          // Basic search by id or status
          if (q) {
            list = list.filter(
              (o) =>
                o.id?.toLowerCase().includes(q) ||
                o.status?.toLowerCase().includes(q),
            );
          }
          const total = list.length;
          const startIndex = Math.max(0, (page - 1) * Math.max(1, pageSize));
          const paged = list.slice(startIndex, startIndex + pageSize);
          setOrders(paged);
          setTotalElements(total);
          setTotalPages(Math.max(1, Math.ceil(total / Math.max(1, pageSize))));
        } else {
          setOrders([]);
          setTotalElements(0);
          setTotalPages(0);
        }
        return; // done
      }

      // If searching, switch to legacy client-side filtering (fetch large page)
      if (q && !useLegacy) {
        setUseLegacy(true);
        setLoading(false);
        return;
      }

      // Default path: use paginated backend
      const sortParam = sortField
        ? `${sortField},${sortDirection}`
        : "createdAt,desc";

      const response = await orderService.getAll({
        page: page - 1, // Backend uses 0-indexed pages
        size: pageSize,
        sort: sortParam,
      });

      if (response.success && response.data) {
        let filteredOrders = response.data.content;
        if (filter !== "ALL") {
          filteredOrders = filteredOrders.filter(
            (order) => order.status === filter,
          );
        }
        setOrders(filteredOrders);
        setTotalElements(response.data.totalElements);
        setTotalPages(response.data.totalPages);
      } else {
        // If unexpected shape, fallback to legacy once
        setUseLegacy(true);
      }
    } catch (error: any) {
      // If backend errors (e.g., 500), enable legacy fallback
      const status = error?.response?.status;
      if (status && status >= 500) {
        setUseLegacy(true);
      }
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, pageSize, search, sortField, sortDirection, filter]);

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPage(1); // Reset to first page when searching
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1); // Reset to first page when sorting
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <i className="bx bx-sort text-[16px]"></i>;
    return sortDirection === "asc" ? (
      <i className="bx bx-sort-up text-[16px]"></i>
    ) : (
      <i className="bx bx-sort-down text-[16px]"></i>
    );
  };

  const loadOrderDetails = async (order: Order) => {
    try {
      setOrderDetailsLoading(true);
      setShowOrderModal(true);
      // Always fetch the latest order details from backend
      const resp = await orderService.getById(order.id);
      if (resp.success && resp.data) {
        const freshOrder = resp.data;
        setSelectedOrder(freshOrder);
        const bowls = freshOrder.bowls || [];
        setOrderBowls(bowls);
        const embeddedItems = bowls.flatMap((b) => b.items || []);
        setBowlItems(embeddedItems);
      } else {
        // Fallback to current order payload if API fails
        setSelectedOrder(order);
        const bowls = order.bowls || [];
        setOrderBowls(bowls);
        const embeddedItems = bowls.flatMap((b) => b.items || []);
        setBowlItems(embeddedItems);
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    if (!confirm("Are you sure you want to confirm this order?")) return;
    try {
      const response = await apiClient.post<{
        data: Order;
        message: string;
        success: boolean;
      }>(`/api/orders/confirm/${id}`);
      if (response.data?.success && response.data?.data) {
        toast.success("Order confirmed successfully");
        loadOrders(); // Reload data to maintain pagination
      } else {
        toast.error(response.data?.message || "Failed to confirm order");
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
      const response = await apiClient.post<{
        data: Order;
        message: string;
        success: boolean;
      }>(`/api/orders/complete/${id}`);
      if (response.data?.success && response.data?.data) {
        toast.success("Order completed successfully");
        loadOrders(); // Reload data to maintain pagination
      } else {
        toast.error(response.data?.message || "Failed to complete order");
      }
    } catch (error) {
      console.error("Failed to complete order:", error);
      toast.error("Failed to complete order");
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt("Enter cancellation reason (optional):");
    try {
      const response = await apiClient.post<{
        data: Order;
        message: string;
        success: boolean;
      }>(
        `/api/orders/cancel/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`,
      );
      if (response.data?.success && response.data?.data) {
        toast.success("Order cancelled successfully");
        loadOrders(); // Reload data to maintain pagination
      } else {
        toast.error(response.data?.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error("Failed to cancel order");
    }
  };

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
            <AdminSearchBar
              value={search}
              onChange={handleSearch}
              placeholder="Tìm đơn hàng..."
            />
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
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-1">
                      Order ID
                      {getSortIcon("id")}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("userId")}
                  >
                    <div className="flex items-center gap-1">
                      User
                      {getSortIcon("userId")}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("storeId")}
                  >
                    <div className="flex items-center gap-1">
                      Store ID
                      {getSortIcon("storeId")}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("subtotalAmount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Subtotal
                      {getSortIcon("subtotalAmount")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Discount
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("totalAmount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total
                      {getSortIcon("totalAmount")}
                    </div>
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
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">
                          {order.id || "N/A"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.userFullName ||
                            `${order.userId?.slice(0, 8) || "N/A"}...`}
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
                          {formatVND(order.subtotalAmount ?? 0)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="text-sm text-green-600">
                          -{formatVND(order.promotionTotal ?? 0)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatVND(order.totalAmount ?? 0)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => loadOrderDetails(order)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Order Details"
                          >
                            <i className="bx bx-show text-[18px]"></i>
                          </button>
                          {order.status === "PENDING" && (
                            <button
                              onClick={() => handleConfirm(order.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Confirm Order"
                            >
                              <i className="bx bx-check text-[18px]"></i>
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
                              <i className="bx bx-check-double text-[18px]"></i>
                            </button>
                          )}
                          {order.status !== "COMPLETED" &&
                            order.status !== "CANCELLED" && (
                              <button
                                onClick={() => handleCancel(order.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel Order"
                              >
                                <i className="bx bx-x text-[18px]"></i>
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
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalElements}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Details - {selectedOrder.id}
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-2xl text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            {orderDetailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                <span className="ml-2">Loading order details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Basic Order Information */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold">
                    Order Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div>
                      <span className="text-sm text-gray-600">Order ID:</span>
                      <p className="font-mono text-sm">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">User:</span>
                      <p className="text-sm">
                        {selectedOrder.userFullName || selectedOrder.userId}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Store ID:</span>
                      <p className="font-mono text-sm">
                        {selectedOrder.storeId}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Pickup Time:
                      </span>
                      <p className="text-sm">
                        {selectedOrder.pickupAt
                          ? new Date(selectedOrder.pickupAt).toLocaleString()
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Created:</span>
                      <p className="text-sm">
                        {selectedOrder.createdAt
                          ? new Date(selectedOrder.createdAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.note && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-600">Note:</span>
                      <p className="rounded border bg-white p-2 text-sm">
                        {selectedOrder.note}
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Totals */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold">Order Totals</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {formatVND(selectedOrder.subtotalAmount ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>
                        -{formatVND(selectedOrder.promotionTotal ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                      <span>Total:</span>
                      <span>{formatVND(selectedOrder.totalAmount ?? 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Bowls */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold">
                    Bowls ({orderBowls.length})
                  </h3>
                  {orderBowls.length === 0 ? (
                    <p className="text-gray-500">
                      No bowls found for this order.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {orderBowls.map((bowl) => (
                        <div
                          key={bowl.id}
                          className="rounded border bg-white p-4"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{bowl.name}</h4>
                              <p className="font-mono text-sm text-gray-600">
                                Bowl ID: {bowl.id}
                              </p>
                              {bowl.template && (
                                <div className="mt-2 flex items-center gap-3">
                                  <div className="relative h-16 w-16">
                                    <ImageWithFallback
                                      src={
                                        bowl.template.imageUrl || "/icon.svg"
                                      }
                                      alt={
                                        bowl.template.name || "Bowl Template"
                                      }
                                      width={64}
                                      height={64}
                                      className="rounded object-cover"
                                      unoptimized
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-800">
                                      Template: {bowl.template.name}
                                    </p>
                                    {bowl.template.description && (
                                      <p className="text-xs text-gray-600">
                                        {bowl.template.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatVND(
                                  (bowl.totalPrice ?? bowl.linePrice) || 0,
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                Qty: {bowl.quantity || 1}
                              </p>
                            </div>
                          </div>

                          {/* Bowl Items */}
                          <div className="mt-3">
                            <h5 className="mb-2 text-sm font-semibold text-gray-700">
                              Ingredients:
                            </h5>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {(bowl.items && bowl.items.length > 0
                                ? bowl.items
                                : bowlItems.filter(
                                    (item) => item.bowlId === bowl.id,
                                  )
                              ).map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between rounded bg-gray-50 p-2 text-sm"
                                >
                                  <span>
                                    {item.ingredient?.name || item.ingredientId}
                                  </span>
                                  <span>Qty: {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            {((bowl.items && bowl.items.length === 0) ||
                              (!bowl.items &&
                                bowlItems.filter(
                                  (item) => item.bowlId === bowl.id,
                                ).length === 0)) && (
                              <p className="text-sm text-gray-500">
                                No ingredients found.
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Transactions removed — backend does not provide per-order payment list */}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
