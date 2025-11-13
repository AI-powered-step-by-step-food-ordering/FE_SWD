'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import apiClient from '@/services/api.config';
import { promotionService } from '@/services/promotion.service';
import type { Promotion } from '@/types/api.types';
import type { PromotionRequest as BackendPromotionRequest } from '@/types/api.types';
import { toast } from 'react-toastify';
import { formatVND } from '@/lib/format-number';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import Pagination from '@/components/admin/Pagination';

type PromotionForm = {
  code: string;
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startDate: string;
  endDate: string;
  active: boolean;
  usageLimit?: number;
};

type UiPromotion = Promotion & { description?: string };

export default function PromotionsPage() {
  useRequireAdmin();
  const [promotions, setPromotions] = useState<UiPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<UiPromotion | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState<PromotionForm>({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    startDate: '',
    endDate: '',
    active: true,
    usageLimit: undefined,
  });

  useEffect(() => {
    loadPromotions();
  }, []);

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
      const response = await promotionService.getAll();
      setPromotions(response?.data || []);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Map frontend form fields to backend PromotionRequest shape
      const payload: BackendPromotionRequest = {
        code: formData.code,
        name: formData.name,
        type: formData.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'AMOUNT',
        percentOff: formData.discountType === 'PERCENTAGE' ? Number(formData.discountValue || 0) : 0,
        amountOff: formData.discountType === 'PERCENTAGE' ? 0 : Number(formData.discountValue || 0),
        minOrderValue: 0, // default when not provided
        startsAt: toOffsetISOStart(formData.startDate),
        endsAt: toOffsetISOEnd(formData.endDate),
        maxRedemptions: formData.usageLimit,
        perOrderLimit: undefined,
        active: formData.active,
      };

      if (editingPromotion) {
        await promotionService.update(editingPromotion.id, payload);
        toast.success('Promotion updated successfully');
      } else {
        await promotionService.create(payload);
        toast.success('Promotion created successfully');
      }
      
      setShowModal(false);
      resetForm();
      loadPromotions();
    } catch (error) {
      console.error('Failed to save promotion:', error);
      toast.error('Failed to save promotion');
    }
  };

  const handleEdit = (promotion: UiPromotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      name: promotion.name,
      description: promotion.description || '',
      discountType: promotion.type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED',
      discountValue: promotion.type === 'PERCENTAGE' ? (promotion.percentOff ?? 0) : (promotion.amountOff ?? 0),
      startDate: promotion.startsAt?.split('T')[0] || '',
      endDate: promotion.endsAt?.split('T')[0] || '',
      active: promotion.active ?? true,
      usageLimit: promotion.maxRedemptions,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      startDate: '',
      endDate: '',
      active: true,
      usageLimit: undefined,
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

  const startIndex = (page - 1) * pageSize;
  const pagedPromotions = promotions.slice(startIndex, startIndex + pageSize);

  return (
    <AdminLayout title="Promotions Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Promotions</h2>
            <p className="text-sm text-gray-600 mt-1">Manage all promotions in the system</p>
          </div>
          <div className="flex items-center gap-4">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <i className="bx bx-plus text-[20px]" aria-hidden="true"></i>
            Add Promotion
          </button>
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Loading...
            </div>
          ) : promotions.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No promotions found
            </div>
          ) : (
            pagedPromotions.map((promotion) => (
              <div key={promotion.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{promotion.name}</h3>
                      {isPromotionActive(promotion) && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded inline-block">
                      {promotion.code}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{promotion.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-semibold text-green-600">
                      {promotion.type === 'PERCENTAGE'
                        ? `${promotion.percentOff ?? 0}%`
                        : formatVND(promotion.amountOff ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-medium text-gray-900 text-xs">
                      {(promotion.startsAt ? new Date(promotion.startsAt).toLocaleDateString() : '')} - {(promotion.endsAt ? new Date(promotion.endsAt).toLocaleDateString() : '')}
                    </span>
                  </div>
                  {promotion.maxRedemptions && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Usage:</span>
                      <span className="font-medium text-gray-900">
                        {promotion.maxRedemptions}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(promotion)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={promotions.length}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseModal} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingPromotion ? 'Edit Promotion' : 'Add New Promotion'}
                  </h3>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount Type *
                        </label>
                        <select
                          required
                          value={formData.discountType}
                          onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="PERCENTAGE">Percentage</option>
                          <option value="FIXED">Fixed Amount</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={Number.isFinite(formData.discountValue as unknown as number) ? (formData.discountValue as unknown as number) : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({
                              ...formData,
                              discountValue: val === '' ? (Number.NaN as unknown as number) : parseFloat(val),
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usage Limit (Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.usageLimit || ''}
                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="flex items-center">
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
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingPromotion ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
