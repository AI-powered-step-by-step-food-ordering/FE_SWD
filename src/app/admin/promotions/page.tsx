"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { promotionService } from "@/services/promotion.service";
import type { Promotion, PromotionRequest } from "@/types/api.types";
import { toast } from "react-toastify";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import Pagination from "@/components/admin/Pagination";
import dynamic from "next/dynamic";

const FirebaseImageUpload = dynamic(
  () => import("@/components/shared/FirebaseImageUpload"),
  { ssr: false },
);

type PromotionForm = {
  code: string;
  name: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  active: boolean;
  imageUrl?: string;
};

export default function PromotionsPage() {
  useRequireAdmin();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState<PromotionForm>({
    code: "",
    name: "",
    discountPercent: 0,
    startDate: "",
    endDate: "",
    active: true,
    imageUrl: "",
  });

  useEffect(() => {
    loadPromotions();
  }, [page, pageSize, showInactive]);

  // Convert HTML date (YYYY-MM-DD) to ISO OffsetDateTime string (UTC)
  const toOffsetISOStart = (dateStr: string | undefined) => {
    if (!dateStr) return undefined;
    try {
      return new Date(`${dateStr}T00:00:00`).toISOString();
    } catch {
      return undefined;
    }
  };
  const toOffsetISOEnd = (dateStr: string | undefined) => {
    if (!dateStr) return undefined;
    try {
      return new Date(`${dateStr}T23:59:59`).toISOString();
    } catch {
      return undefined;
    }
  };

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const params = {
        page: page - 1,
        size: pageSize,
        sortBy: "createdAt",
        sortDir: "desc" as const,
      };
      const response = showInactive
        ? await promotionService.getInactive(params)
        : await promotionService.getActive(params);
      const pageData = response?.data;
      const content = pageData?.content || [];
      setPromotions(content);
      setTotalElements(pageData?.totalElements || 0);
      setTotalPages(pageData?.totalPages || 0);
    } catch (error) {
      console.error("Failed to load promotions:", error);
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: PromotionRequest = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        discountPercent: Number(formData.discountPercent || 0),
        startsAt: toOffsetISOStart(formData.startDate),
        endsAt: toOffsetISOEnd(formData.endDate),
        isActive: formData.active,
        imageUrl: formData.imageUrl || "",
      };

      if (editingPromotion) {
        await promotionService.update(editingPromotion.id, payload);
        toast.success("Promotion updated successfully");
      } else {
        await promotionService.create(payload);
        toast.success("Promotion created successfully");
      }

      setShowModal(false);
      resetForm();
      loadPromotions();
    } catch (error) {
      console.error("Failed to save promotion:", error);
      toast.error("Failed to save promotion");
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);

    // Extract date from startsAt/endsAt (handle both string and Date objects)
    const getDateString = (dateValue: any) => {
      if (!dateValue) return "";
      try {
        if (typeof dateValue === "string") {
          return dateValue.split("T")[0];
        }
        return new Date(dateValue).toISOString().split("T")[0];
      } catch {
        return "";
      }
    };

    setFormData({
      code: promotion.code,
      name: promotion.name,
      discountPercent: promotion.discountPercent,
      startDate: getDateString(promotion.startsAt),
      endDate: getDateString(promotion.endsAt),
      active: promotion.active ?? true,
      imageUrl: promotion.imageUrl || "",
    });
    setShowModal(true);
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    try {
      await promotionService.softDelete(id);
      toast.success("Promotion deleted successfully");
      loadPromotions();
    } catch (error) {
      console.error("Failed to delete promotion:", error);
      toast.error("Failed to delete promotion");
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Are you sure you want to restore this promotion?")) return;

    try {
      await promotionService.restore(id);
      toast.success("Promotion restored successfully");
      loadPromotions();
    } catch (error) {
      console.error("Failed to restore promotion:", error);
      toast.error("Failed to restore promotion");
    }
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setFormData({
      code: "",
      name: "",
      discountPercent: 0,
      startDate: "",
      endDate: "",
      active: true,
      imageUrl: "",
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const isPromotionActive = (promotion: Promotion) => {
    if (promotion.active === false) return false;
    const now = new Date();
    const start = promotion.startsAt ? new Date(promotion.startsAt) : undefined;
    const end = promotion.endsAt ? new Date(promotion.endsAt) : undefined;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  return (
    <AdminLayout title="Promotions Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Promotions</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage all promotions in the system
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!showInactive ? "font-medium text-green-600" : "text-gray-500"}`}>
                Active
              </span>
              <button
                onClick={() => {
                  setShowInactive(!showInactive);
                  setPage(1);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showInactive ? "bg-red-600" : "bg-green-600"}`}
                aria-label="Toggle Active/Inactive"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showInactive ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              <span className={`text-sm ${showInactive ? "font-medium text-red-600" : "text-gray-500"}`}>
                Inactive
              </span>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            >
              <i className="bx bx-plus text-[20px]" aria-hidden="true"></i>
              Add Promotion
            </button>
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              Loading...
            </div>
          ) : promotions.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              No promotions found
            </div>
          ) : (
            promotions.map((promotion) => (
              <div
                key={promotion.id}
                className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {promotion.imageUrl && (
                  <div className="h-48 w-full bg-gray-100">
                    <img
                      src={promotion.imageUrl}
                      alt={promotion.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {promotion.name}
                        </h3>
                        {isPromotionActive(promotion) && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="inline-block rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-700">
                        {promotion.code}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-semibold text-green-600">
                        {promotion.discountPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Period:</span>
                      <span className="text-xs font-medium text-gray-900">
                        {promotion.startsAt
                          ? new Date(promotion.startsAt).toLocaleDateString()
                          : "N/A"}{" "}
                        -{" "}
                        {promotion.endsAt
                          ? new Date(promotion.endsAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {promotion.active === false ? (
                      <button
                        onClick={() => handleRestore(promotion.id)}
                        className="flex-1 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-600 transition-colors hover:bg-green-100"
                      >
                        <i className="bx bx-redo mr-1"></i>
                        Restore
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                        >
                          <i className="bx bx-edit-alt mr-1"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => handleSoftDelete(promotion.id)}
                          className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                        >
                          <i className="bx bx-trash mr-1"></i>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCloseModal}
            />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">
                    {editingPromotion ? "Edit Promotion" : "Add New Promotion"}
                  </h3>

                  <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Discount Percent (0-100) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        value={formData.discountPercent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Promotion Image (Optional)
                      </label>
                      <FirebaseImageUpload
                        value={formData.imageUrl || ""}
                        onChange={(url: string) =>
                          setFormData({ ...formData, imageUrl: url })
                        }
                        folder="promotions"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split("T")[0]}
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          End Date *
                        </label>
                        <input
                          type="date"
                          required
                          min={
                            formData.startDate ||
                            new Date().toISOString().split("T")[0]
                          }
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    {/* <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="active"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                        Active
                      </label>
                    </div> */}
                  </div>
                </div>

                <div className="gap-2 bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 sm:w-auto"
                  >
                    {editingPromotion ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
