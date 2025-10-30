"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import FirebaseImageUpload from "@/components/shared/FirebaseImageUpload";
import { apiClient } from "@/lib/api";
import { getFirebaseThumbnail } from "@/lib/firebase-storage";
import type { Category, CategoryRequest } from "@/types/api";
import { toast } from "react-toastify";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryRequest>({
    name: "",
    kind: "CARB",
    imageUrl: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAll<Category>("categories");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await apiClient.update("categories", editingCategory.id, formData);
        toast.success("Category updated successfully");
      } else {
        await apiClient.create("categories", formData);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await apiClient.delete("categories", id);
      toast.success("Category deleted successfully");
      loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      kind: category.kind,
      imageUrl: category.imageUrl || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      kind: "CARB",
      imageUrl: "",
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <AdminLayout title="Categories Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage all categories in the system
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Category
          </button>
        </div>

        {/* Categories Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Kind
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
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        {category.imageUrl ? (
                          <Image
                            src={getFirebaseThumbnail(category.imageUrl)}
                            alt={category.name}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                            <span className="text-xs text-gray-400">
                              No img
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
                          {category.kind}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(category)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h3>

                  <div className="space-y-4">
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
                        Kind *
                      </label>
                      <select
                        required
                        value={formData.kind}
                        onChange={(e) =>
                          setFormData({ ...formData, kind: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="CARB">
                          Carb - Tinh bột (cơm, mì, khoai...)
                        </option>
                        <option value="PROTEIN">
                          Protein - Đạm (thịt, cá, đậu phụ...)
                        </option>
                        <option value="VEGGIE">Veggie - Rau củ</option>
                        <option value="SAUCE">Sauce - Nước sốt</option>
                        <option value="TOPPING">Topping - Topping</option>
                        <option value="OTHER">Other - Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Category Icon/Image
                      </label>
                      <FirebaseImageUpload
                        value={formData.imageUrl}
                        onChange={(url: string) =>
                          setFormData({ ...formData, imageUrl: url })
                        }
                        folder="categories"
                        maxSizeMB={5}
                      />
                    </div>
                  </div>
                </div>

                <div className="gap-2 bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 sm:w-auto"
                  >
                    {editingCategory ? "Update" : "Create"}
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
