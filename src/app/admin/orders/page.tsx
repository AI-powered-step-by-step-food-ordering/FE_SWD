"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/services/api.config";
import orderService from "@/services/order.service";
import bowlService from "@/services/bowl.service";
import paymentService from "@/services/payment.service";
import type {
  Order,
  Bowl,
  BowlItem,
  PaymentTransaction,
} from "@/types/api.types";
import { toast } from "react-toastify";
import { formatVND } from "@/lib/format-number";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import Pagination from "@/components/admin/Pagination";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { getFirebaseThumbnail } from "@/lib/firebase-storage";

export default function OrdersPage() {
  useRequireAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal state for order details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderBowls, setOrderBowls] = useState<Bowl[]>([]);
  const [bowlItems, setBowlItems] = useState<BowlItem[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<
    PaymentTransaction[]
  >([]);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [page, pageSize, filter, search]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const q = search.trim();

      // Use search endpoint when there's a search query or status filter
      if (q || filter !== "ALL") {
        const searchParams: any = {
          page: page - 1,
          size: pageSize,
          sortBy: "createdAt",
          sortDir: "desc",
        };

        // Add search query parameters if provided
        if (q) {
          searchParams.fullName = q;
        }

        // Add status filter if not ALL
        if (filter !== "ALL") {
          searchParams.status = filter;
        }

        const response = await orderService.search(searchParams);
        const pageData = response.data;
        const list = pageData?.content || [];

        setOrders(list);
        setTotal(pageData?.totalElements ?? list.length ?? 0);
      } else {
        // Use getAll endpoint when no search/filter (it includes bowls with templates)
        const response = await orderService.getAll({
          page: page - 1,
          size: pageSize,
          sortBy: "createdAt",
          sortDir: "desc",
        });

        const pageData = response.data;
        const list = pageData?.content || [];

        setOrders(list);
        setTotal(pageData?.totalElements ?? list.length ?? 0);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (order: Order) => {
    try {
      setOrderDetailsLoading(true);
      setShowOrderModal(true);

      // Fetch full order details with store and template information
      const orderResponse = await orderService.getById(order.id, ['store', 'template']);
      if (orderResponse.success && orderResponse.data) {
        setSelectedOrder(orderResponse.data);
        
        // Use bowls data from the order response
        const orderBowls = (orderResponse.data as any).bowls || [];
        setOrderBowls(orderBowls);

        // Extract bowl items from the bowls data (if items are included)
        const orderBowlItems = orderBowls.flatMap(
          (bowl: any) => bowl.items || [],
        );
        setBowlItems(orderBowlItems);
      } else {
        // Fallback to using the order passed in
        setSelectedOrder(order);
        const orderBowls = (order as any).bowls || [];
        setOrderBowls(orderBowls);
        const orderBowlItems = orderBowls.flatMap(
          (bowl: any) => bowl.items || [],
        );
        setBowlItems(orderBowlItems);
      }

      // Load payment transactions for this order
      const paymentsResponse = await paymentService.getByOrderId(order.id);
      setPaymentTransactions(paymentsResponse.data || []);
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error("Failed to load order details");
      // Fallback to using the order passed in
      setSelectedOrder(order);
      const orderBowls = (order as any).bowls || [];
      setOrderBowls(orderBowls);
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
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, status: response.data.data.status }
              : order,
          ),
        );
        toast.success("Order confirmed successfully");
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
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, status: response.data.data.status }
              : order,
          ),
        );
        toast.success("Order completed successfully");
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
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? { ...order, status: response.data.data.status }
              : order,
          ),
        );
        toast.success("Order cancelled successfully");
      } else {
        toast.error(response.data?.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error("Failed to cancel order");
    }
  };

  // Server-side pagination: orders contains the current page content

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
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
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm đơn hàng..."
            />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((status) => {
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
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Store
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
                          {order.userFullName || "N/A"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          {order.store?.imageUrl ? (
                            <ImageWithFallback
                              src={getFirebaseThumbnail(order.store.imageUrl)}
                              alt={order.store.name || "Store"}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                              fallbackSrc="/icon.svg"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                              <i className="bx bx-store text-gray-400 text-xl"></i>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.store?.name || order.storeId || "N/A"}
                            </div>
                            {order.store?.address && (
                              <div className="text-xs text-gray-500">
                                {order.store.address}
                              </div>
                            )}
                          </div>
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
                              <i className="bx bx-check-square text-[18px]"></i>
                            </button>
                          )}
                          {(order.status === "CONFIRMED" ||
                            order.status === "PREPARING" ||
                            order.status === "READY") && (
                            <button
                              onClick={() => handleComplete(order.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Complete Order"
                            >
                              <i className="bx bx-check-circle text-[18px]"></i>
                            </button>
                          )}
                          {order.status !== "COMPLETED" &&
                            order.status !== "CANCELLED" && (
                              <button
                                onClick={() => handleCancel(order.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel Order"
                              >
                                <i className="bx bx-x-circle text-[18px]"></i>
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
          total={total}
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
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <i className="bx bx-x text-2xl"></i>
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
                      <span className="text-sm text-gray-600">
                        Customer Name:
                      </span>
                      <p className="text-sm font-medium">
                        {selectedOrder.userFullName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">User ID:</span>
                      <p className="font-mono text-sm">
                        {selectedOrder.userId}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Store:</span>
                      <div className="mt-1 flex items-center gap-2">
                        {selectedOrder.store?.imageUrl ? (
                          <ImageWithFallback
                            src={getFirebaseThumbnail(selectedOrder.store.imageUrl)}
                            alt={selectedOrder.store.name || "Store"}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                            fallbackSrc="/icon.svg"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                            <i className="bx bx-store text-gray-400 text-2xl"></i>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {selectedOrder.store?.name || selectedOrder.storeId || "N/A"}
                          </p>
                          {selectedOrder.store?.address && (
                            <p className="text-xs text-gray-500">
                              {selectedOrder.store.address}
                            </p>
                          )}
                          {selectedOrder.store?.phone && (
                            <p className="text-xs text-gray-500">
                              {selectedOrder.store.phone}
                            </p>
                          )}
                        </div>
                      </div>
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
                          ? new Date(
                              selectedOrder.createdAt as any,
                            ).toLocaleString()
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
                            <div className="flex items-start gap-3 flex-1">
                              {(bowl as any).template?.imageUrl ? (
                                <ImageWithFallback
                                  src={getFirebaseThumbnail((bowl as any).template.imageUrl)}
                                  alt={bowl.name || "Bowl"}
                                  width={80}
                                  height={80}
                                  className="rounded-lg object-cover flex-shrink-0"
                                  fallbackSrc="/icon.svg"
                                />
                              ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200 flex-shrink-0">
                                  <i className="bx bx-bowl-rice text-gray-400 text-3xl"></i>
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold">{bowl.name}</h4>
                                <p className="font-mono text-sm text-gray-600">
                                  Bowl ID: {bowl.id}
                                </p>
                                {(bowl as any).template?.name && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Template: {(bowl as any).template.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatVND(
                                  (bowl as any).totalPrice ??
                                    (bowl as any).linePrice ??
                                    0,
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Bowl Items */}
                          <div className="mt-3">
                            <h5 className="mb-2 text-sm font-semibold text-gray-700">
                              Ingredients:
                            </h5>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {((bowl as any).items || []).length > 0 ? (
                                // Display items if available
                                ((bowl as any).items || []).map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between rounded bg-gray-50 p-2 text-sm"
                                  >
                                    <span>
                                      {item.ingredient?.name ||
                                        item.ingredientName}
                                    </span>
                                    <span>
                                      {item.quantity}{" "}
                                      {item.ingredient?.unit ||
                                        item.unit ||
                                        "g"}
                                    </span>
                                  </div>
                                ))
                              ) : (bowl as any).template?.steps ? (
                                // Display template default ingredients if items not available
                                (bowl as any).template.steps
                                  .sort(
                                    (a: any, b: any) =>
                                      a.displayOrder - b.displayOrder,
                                  )
                                  .flatMap(
                                    (step: any) =>
                                      step.defaultIngredients || [],
                                  )
                                  .map((ing: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between rounded bg-gray-50 p-2 text-sm"
                                    >
                                      <span>{ing.ingredientName}</span>
                                      <span>
                                        {ing.quantity} {ing.unit || "g"}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No ingredients found.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Transactions */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold">
                    Payment Transactions ({paymentTransactions.length})
                  </h3>
                  {paymentTransactions.length === 0 ? (
                    <p className="text-gray-500">
                      No payment transactions found for this order.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {paymentTransactions.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded border bg-white p-4"
                        >
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                              <span className="text-sm text-gray-600">
                                Transaction ID:
                              </span>
                              <p className="font-mono text-sm">{payment.id}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">
                                Amount:
                              </span>
                              <p className="font-semibold">
                                {formatVND(payment.amount ?? 0)}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">
                                Status:
                              </span>
                              <p className="text-sm">
                                {payment.status || "Unknown"}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">
                                Method:
                              </span>
                              <p className="text-sm">
                                {(payment as any).paymentMethod ||
                                  (payment as any).method ||
                                  "Unknown"}
                              </p>
                            </div>
                          </div>
                          {(payment as any).transactionId ||
                          (payment as any).providerTxnId ? (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">
                                External Transaction ID:
                              </span>
                              <p className="font-mono text-sm">
                                {(payment as any).transactionId ||
                                  (payment as any).providerTxnId}
                              </p>
                            </div>
                          ) : null}
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
