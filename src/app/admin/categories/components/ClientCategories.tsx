'use client';

import { useEffect, useState } from "react";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import Pagination from '@/components/admin/Pagination';
import dynamic from "next/dynamic";
import apiClient from "@/services/api.config";
import categoryService from "@/services/category.service";
import { getFirebaseThumbnail } from "@/lib/firebase-storage";
import type { Category, CategoryRequest } from "@/types/api.types";
import { toast } from "react-toastify";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

const FirebaseImageUpload = dynamic(() => import("@/components/shared/FirebaseImageUpload"), { ssr: false });

type Props = {
  initialCategories?: Category[];
};

export default function ClientCategories({ initialCategories = [] }: Props) {
  useRequireAdmin();

  type UiCategory = Category & { imageUrl?: string };
  const [categories, setCategories] = useState<UiCategory[]>(initialCategories as UiCategory[]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UiCategory | null>(null);
  type CategoryForm = CategoryRequest & { imageUrl?: string };
  const [formData, setFormData] = useState<CategoryForm>({
    name: "",
    kind: "CARB",
    displayOrder: 0,
    active: true,
    imageUrl: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadCategories();
  }, [showInactive, page, pageSize, sortField, sortDirection]);

  const loadCategories = async () => {
    try {
      setLoading(true);

      // Use server-side active/inactive endpoints with pagination
      const response = showInactive 
        ? await categoryService.getInactiveCategories({
            page: page - 1,
            size: pageSize,
            sortBy: sortField,
            sortDir: sortDirection,
          })
        : await categoryService.getActive({
            page: page - 1,
            size: pageSize,
            sortBy: sortField,
            sortDir: sortDirection,
          });

      if (response.success && response.data) {
        const { content, totalElements: total, totalPages: pages } = response.data;
        setCategories(content);
        setTotalElements(total);
        setTotalPages(pages);
      } else {
        setCategories([]);
        setTotalElements(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        kind: formData.kind,
        displayOrder: formData.displayOrder ?? 0,
        active: editingCategory ? editingCategory.active : true,
        // UI-only field; backend may accept or ignore
        ...(formData.imageUrl ? { imageUrl: formData.imageUrl } : {}),
      };

      if (editingCategory) {
        await apiClient.put(
          `/api/categories/update/${editingCategory.id}`,
          payload,
        );
        toast.success("Category updated successfully");
      } else {
        await apiClient.post("/api/categories/create", payload);
        toast.success("Category created successfully");
      }
      setShowModal(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Failed to save category");
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await categoryService.softDelete(id);
        toast.success("Category deleted successfully");
        loadCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Failed to delete category");
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (window.confirm("Are you sure you want to restore this category?")) {
      try {
        await categoryService.restore(id);
        toast.success("Category restored successfully");
        loadCategories();
      } catch (error) {
        console.error("Error restoring category:", error);
        toast.error("Failed to restore category");
      }
    }
  };

  const handleEdit = (category: UiCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      kind: category.kind,
      displayOrder: category.displayOrder ?? 0,
      active: category.active ?? true,
      imageUrl: category.imageUrl || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      kind: "CARB",
      displayOrder: 0,
      active: true,
      imageUrl: "",
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <i className="bx bx-sort text-[16px]"></i>;
    return sortDirection === 'asc' ? (
      <i className="bx bx-sort-up text-[16px]"></i>
    ) : (
      <i className="bx bx-sort-down text-[16px]"></i>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
          <p className="mt-1 text-sm text-gray-600">Manage all categories in the system</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${!showInactive ? 'font-medium text-green-600' : 'text-gray-500'}`}>Active</span>
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showInactive ? 'bg-red-600' : 'bg-green-600'
              }`}
              aria-label="Toggle Active/Inactive"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showInactive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${showInactive ? 'font-medium text-red-600' : 'text-gray-500'}`}>Inactive</span>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            <i className="bx bx-plus text-[20px]"></i>
            Add Category
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Name <span className="text-sm">{getSortIcon('name')}</span></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('kind')}>
                  <div className="flex items-center gap-1">Kind <span className="text-sm">{getSortIcon('kind')}</span></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('active')}>
                  <div className="flex items-center gap-1">Status <span className="text-sm">{getSortIcon('active')}</span></div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                Array.from({ length: Math.min(pageSize, 8) }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-200 animate-pulse rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 animate-pulse rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 animate-pulse rounded" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 animate-pulse rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><div className="h-8 w-16 bg-gray-200 animate-pulse rounded" /><div className="h-8 w-24 bg-gray-200 animate-pulse rounded" /></div></td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2"><span className="text-xl">📂</span></div>
                      <div className="text-lg font-semibold">Không có Category nào</div>
                      <div className="text-sm">Hãy thêm category mới để bắt đầu quản lý.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      {category.imageUrl ? (
                        <ImageWithFallback src={getFirebaseThumbnail(category.imageUrl)} alt={category.name} width={40} height={40} className="rounded-lg object-cover" fallbackSrc="/icon.svg" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200"><span className="text-xs text-gray-400">No img</span></div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4"><div className="text-sm font-medium text-gray-900">{category.name}</div></td>
                    <td className="whitespace-nowrap px-6 py-4"><span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">{category.kind}</span></td>
                    <td className="whitespace-nowrap px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${category.active === true ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{category.active === true ? "Active" : "Inactive"}</span></td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {category.active === false ? (
                        <button onClick={() => handleRestore(category.id)} className="mr-4 text-green-600 hover:text-green-900">Restore</button>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(category)} className="mr-4 text-blue-600 hover:text-blue-900">Edit</button>
                          <button onClick={() => handleSoftDelete(category.id)} className="text-orange-600 hover:text-orange-900">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalElements}
            onPageChange={(p)=>setPage(p)}
            onPageSizeChange={(s)=>{ setPageSize(s); setPage(1); }}
          />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal} />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">{editingCategory ? "Edit Category" : "Add New Category"}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Kind *</label>
                      <select required value={formData.kind} onChange={(e) => setFormData({ ...formData, kind: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="CARB">Carb - Tinh bột (cơm, mì, khoai...)</option>
                        <option value="PROTEIN">Protein - Đạm (thịt, cá, đậu phụ...)</option>
                        <option value="VEGGIE">Veggie - Rau củ</option>
                        <option value="SAUCE">Sauce - Nước sốt</option>
                        <option value="TOPPING">Topping - Topping</option>
                        <option value="OTHER">Other - Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Category Icon/Image</label>
                      <FirebaseImageUpload
                        value={formData.imageUrl}
                        onChange={(url: string) => setFormData({ ...formData, imageUrl: url })}
                      />
                      {formData.imageUrl && (
                        <div className="mt-2">
                          <ImageWithFallback src={getFirebaseThumbnail(formData.imageUrl)} alt="Preview" width={60} height={60} className="rounded object-cover" fallbackSrc="/icon.svg" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button type="submit" className="inline-flex w-full justify-center rounded-md bg-green-600 px-4 py-2 text-white shadow-sm hover:bg-green-700 sm:ml-3 sm:w-auto">{editingCategory ? "Update" : "Create"}</button>
                  <button type="button" onClick={handleCloseModal} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}