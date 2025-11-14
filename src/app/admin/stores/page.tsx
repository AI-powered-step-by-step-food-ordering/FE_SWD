'use client';

import { useEffect, useState, useCallback } from 'react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import AdminLayout from '@/components/admin/AdminLayout';
import dynamic from 'next/dynamic';
import storeService from '@/services/store.service';
import { getFirebaseThumbnail } from '@/lib/firebase-storage';
import type { Store, StoreRequest } from '@/types/api.types';
import { toast } from 'react-toastify';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import Pagination from '@/components/admin/Pagination';

const FirebaseImageUpload = dynamic(() => import('@/components/shared/FirebaseImageUpload'), {
  ssr: false
});

export default function StoresPage() {
  useRequireAdmin();
  type UiStore = Store & { active?: boolean; openingHours?: string; imageUrl?: string };
  type StoreForm = StoreRequest & { active: boolean; openingHours?: string; imageUrl?: string };
  const [stores, setStores] = useState<UiStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState<UiStore | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [formData, setFormData] = useState<StoreForm>({
    name: '',
    address: '',
    phone: '',
    active: true,
    openingHours: '',
    imageUrl: '',
  });

  useEffect(() => {
    loadStores();
  }, [page, pageSize, sortField, sortDirection]);

  const loadStores = async () => {
    try {
      setLoading(true);
      
      // Use the getAll endpoint with pagination and sorting
      const response = await storeService.getAll({
        page: page - 1, // Backend uses 0-based indexing
        size: pageSize,
        sortBy: sortField,
        sortDir: sortDirection,
      });
      
      if (response.success && response.data) {
        const data = response.data as any;
        const storesList = data.content || [];
        setStores(storesList);
        setTotalElements(data.totalElements || storesList.length);
        setTotalPages(data.totalPages || 1);
      } else {
        setStores([]);
        setTotalElements(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting
  const handleSort = (field: string, direction?: 'asc' | 'desc') => {
    if (direction) {
      setSortField(field);
      setSortDirection(direction);
    } else if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1); // Reset to first page when sorting
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <i className="bx bx-sort" aria-hidden="true"></i>;
    return sortDirection === 'asc'
      ? <i className="bx bx-sort-up" aria-hidden="true"></i>
      : <i className="bx bx-sort-down" aria-hidden="true"></i>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: StoreRequest = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
      };
      if (editingStore) {
        await storeService.update(editingStore.id, payload);
        toast.success('Store updated successfully');
      } else {
        await storeService.create(payload);
        toast.success('Store created successfully');
      }
      
      setShowModal(false);
      resetForm();
      loadStores(); // Reload data to maintain pagination
    } catch (error) {
      console.error('Failed to save store:', error);
      toast.error('Failed to save store');
    }
  };

  const handleEdit = (store: UiStore) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone,
      active: store.active ?? true,
      openingHours: store.openingHours || '',
      imageUrl: store.imageUrl || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingStore(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      active: true,
      openingHours: '',
      imageUrl: '',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <AdminLayout title="Stores Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Stores</h2>
            <p className="text-sm text-gray-600 mt-1">Manage all stores in the system</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                handleSort(field, direction as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="address-asc">Address (A-Z)</option>
              <option value="address-desc">Address (Z-A)</option>
              <option value="active-desc">Active First</option>
              <option value="active-asc">Inactive First</option>
            </select>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <i className="bx bx-plus text-[20px]"></i>
            Add Store
          </button>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Loading...
            </div>
          ) : stores.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No stores found
            </div>
          ) : (
            stores.map((store) => (
              <div key={store.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {store.imageUrl ? (
                        <div className="mb-3">
                          <ImageWithFallback
                            src={getFirebaseThumbnail(store.imageUrl)}
                            alt={store.name}
                            width={200}
                            height={120}
                            className="w-full h-32 object-cover rounded-lg"
                            fallbackSrc="/icon.svg"
                          />
                        </div>
                      ) : (
                        <div className="mb-3 w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No image</span>
                        </div>
                      )}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        store.active === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {store.active === true ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <i className="bx bx-map text-gray-400 text-[20px] mt-0.5 flex-shrink-0" aria-hidden="true"></i>
                    <p className="text-sm text-gray-600 flex-1">{store.address}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <i className="bx bx-phone text-gray-400 text-[20px] flex-shrink-0" aria-hidden="true"></i>
                    <p className="text-sm text-gray-600">{store.phone}</p>
                  </div>


                  {store.openingHours && (
                    <div className="flex items-center gap-2">
                      <i className="bx bx-time-five text-gray-400 text-[20px] flex-shrink-0" aria-hidden="true"></i>
                      <p className="text-sm text-gray-600">{store.openingHours}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(store)}
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
          total={totalElements}
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
                    {editingStore ? 'Edit Store' : 'Add New Store'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store Image
                      </label>
                      <FirebaseImageUpload
                         value={formData.imageUrl}
                         onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                         folder="stores"
                         label="Store Image"
                         maxSizeMB={5}
                         showPreview={true}
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
                        Address *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opening Hours
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Mon-Fri: 8AM-10PM, Sat-Sun: 9AM-9PM"
                        value={formData.openingHours}
                        onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
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
                    {editingStore ? 'Update' : 'Create'}
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
