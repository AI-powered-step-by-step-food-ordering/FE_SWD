"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import Pagination from "@/components/admin/Pagination";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import bowlTemplateService from "@/services/bowlTemplate.service";
import templateStepService from "@/services/templateStep.service";
import categoryService from "@/services/category.service";
import type {
  BowlTemplate,
  BowlTemplateRequest,
  TemplateStep,
  TemplateStepRequest,
  Category,
} from "@/types/api.types";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { getFirebaseThumbnail } from "@/lib/firebase-storage";

const FirebaseImageUpload = dynamic(
  () => import("@/components/shared/FirebaseImageUpload"),
  { ssr: false },
);

type Props = {
  initialTemplates?: BowlTemplate[];
  initialCategories?: Category[];
};

export default function ClientBowlTemplates({
  initialTemplates = [],
  initialCategories = [],
}: Props) {
  useRequireAdmin();

  // Core state
  const [templates, setTemplates] = useState<BowlTemplate[]>(initialTemplates);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Search & pagination (server-side)
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [showInactive, setShowInactive] = useState<boolean>(false);

  // Sorting
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Create/Edit Template modal
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [isEditTemplate, setIsEditTemplate] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BowlTemplate | null>(
    null,
  );
  const [templateForm, setTemplateForm] = useState<BowlTemplateRequest>({
    name: "",
    description: "",
    imageUrl: "",
    active: true,
  });

  // Steps management
  const [showStepsModal, setShowStepsModal] = useState<boolean>(false);
  const [stepsLoading, setStepsLoading] = useState<boolean>(false);
  const [templateSteps, setTemplateSteps] = useState<TemplateStep[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [stepForm, setStepForm] = useState<Partial<TemplateStepRequest>>({
    minItems: 0,
    maxItems: 1,
    defaultQty: 1,
    displayOrder: 1,
    templateId: "",
    categoryId: "",
  });
  const [editingStep, setEditingStep] = useState<TemplateStep | null>(null);

  // Load templates with server-side pagination, search, sort, and filter
  useEffect(() => {
    loadTemplates();
  }, [showInactive, page, pageSize, search, sortField, sortDirection]);

  useEffect(() => {
    // Load categories once
    const loadCategories = async () => {
      if (!initialCategories || initialCategories.length === 0) {
        try {
          const catRes = await categoryService.getAll({
            page: 0,
            size: 500,
            sortBy: "name",
            sortDir: "asc",
          } as any);
          const catArr = Array.isArray(catRes.data)
            ? catRes.data
            : (catRes.data?.content ?? []);
          setCategories(catArr);
        } catch (err) {
          console.error("Failed to load categories", err);
        }
      }
    };
    loadCategories();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const q = search.trim();

      // Use server-side search when there's a search query
      if (q) {
        const response = await bowlTemplateService.search({
          searchText: q,
          page: page - 1,
          size: pageSize,
          sortBy: sortField,
          sortDir: sortDirection,
        });

        if (response.success && response.data) {
          const {
            content,
            totalElements: total,
            totalPages: pages,
          } = response.data;
          setTemplates(content);
          setTotalElements(total);
          setTotalPages(pages);
        } else {
          setTemplates([]);
          setTotalElements(0);
          setTotalPages(0);
        }
      } else {
        // Use server-side active/inactive endpoints with pagination
        const response = showInactive
          ? await bowlTemplateService.getInactiveTemplates()
          : await bowlTemplateService.getActive({
              page: page - 1,
              size: pageSize,
              sortBy: sortField,
              sortDir: sortDirection,
            });

        if (response.success && response.data) {
          // Handle both array and paged response formats
          const data = response.data as any;
          const content = Array.isArray(data) ? data : data.content || [];
          const total = data.totalElements || content.length;
          const pages = data.totalPages || Math.ceil(content.length / pageSize);

          setTemplates(content);
          setTotalElements(total);
          setTotalPages(pages);
        } else {
          setTemplates([]);
          setTotalElements(0);
          setTotalPages(0);
        }
      }
    } catch (err) {
      console.error("Failed to load templates", err);
      setError("Không thể tải danh sách bowl templates");
      toast.error("Tải bowl templates thất bại");
      setTemplates([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const getIsActive = (
    t: BowlTemplate | (BowlTemplate & { status?: string }),
  ) => {
    if (typeof (t as any).active === "boolean") return (t as any).active;
    if (typeof (t as any).status === "string")
      return (t as any).status === "ACTIVE";
    return true;
  };

  const resetTemplateForm = () => {
    setTemplateForm({ name: "", description: "", imageUrl: "", active: true });
    setSelectedTemplate(null);
    setIsEditTemplate(false);
  };

  const openCreateTemplate = () => {
    resetTemplateForm();
    setShowTemplateModal(true);
  };
  const openEditTemplate = (t: BowlTemplate) => {
    setSelectedTemplate(t);
    setTemplateForm({
      name: t.name || "",
      description: t.description || "",
      imageUrl: t.imageUrl || "",
      active: getIsActive(t),
    });
    setIsEditTemplate(true);
    setShowTemplateModal(true);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <i className="bx bx-sort text-[16px]"></i>;
    return sortDirection === "asc" ? (
      <i className="bx bx-sort-up text-[16px]"></i>
    ) : (
      <i className="bx bx-sort-down text-[16px]"></i>
    );
  };

  const handleSoftDelete = async (id: string) => {
    if (
      window.confirm("Are you sure you want to soft delete this bowl template?")
    ) {
      try {
        await bowlTemplateService.softDelete(id);
        toast.success("Bowl template soft deleted successfully");
        loadTemplates();
      } catch (error) {
        console.error("Error soft deleting bowl template:", error);
        toast.error("Failed to soft delete bowl template");
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (
      window.confirm("Are you sure you want to restore this bowl template?")
    ) {
      try {
        await bowlTemplateService.restore(id);
        toast.success("Bowl template restored successfully");
        loadTemplates();
      } catch (error) {
        console.error("Error restoring bowl template:", error);
        toast.error("Failed to restore bowl template");
      }
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.name?.trim()) {
        toast.warn("Tên template là bắt buộc");
        return;
      }
      const payload: BowlTemplateRequest = {
        name: templateForm.name,
        description: templateForm.description || "",
        imageUrl: templateForm.imageUrl || "",
        active: templateForm.active ?? true,
      };
      if (isEditTemplate && selectedTemplate?.id) {
        const res = await bowlTemplateService.update(
          selectedTemplate.id,
          payload,
        );
        if (res.success) {
          toast.success("Cập nhật bowl template thành công");
          loadTemplates();
          setShowTemplateModal(false);
          resetTemplateForm();
        } else {
          toast.error(res.message || "Cập nhật thất bại");
        }
      } else {
        const res = await bowlTemplateService.create(payload);
        if (res.success) {
          toast.success("Tạo bowl template thành công");
          loadTemplates();
          setShowTemplateModal(false);
          resetTemplateForm();
        } else {
          toast.error(res.message || "Tạo mới thất bại");
        }
      }
    } catch (err) {
      console.error("Save template error", err);
      toast.error("Lưu bowl template thất bại");
    }
  };

  const handleDeleteTemplate = async (t: BowlTemplate) => {
    // Use soft delete for inactive items, restore for active items
    if (t.active === false) {
      await handleRestore(t.id);
    } else {
      await handleSoftDelete(t.id);
    }
  };

  const openStepsModal = async (t: BowlTemplate) => {
    setSelectedTemplate(t);
    setShowStepsModal(true);
    setStepsLoading(true);
    setEditingStep(null);
    setStepForm({
      minItems: 0,
      maxItems: 1,
      defaultQty: 1,
      displayOrder: 1,
      templateId: t.id,
      categoryId: categories[0]?.id || "",
    });
    try {
      const res = await templateStepService.getByTemplateId(t.id);
      const steps = (res.data || []).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );
      setTemplateSteps(steps);
    } catch (err) {
      console.error("Load steps error", err);
      toast.error("Tải Template Steps thất bại");
    } finally {
      setStepsLoading(false);
    }
  };

  const closeStepsModal = () => {
    setShowStepsModal(false);
    setSelectedTemplate(null);
    setTemplateSteps([]);
    setEditingStep(null);
  };

  const saveStep = async () => {
    try {
      if (!stepForm.templateId || !stepForm.categoryId) {
        toast.warn("Vui lòng chọn Template và Category");
        return;
      }
      if (
        stepForm.minItems === undefined ||
        stepForm.maxItems === undefined ||
        stepForm.defaultQty === undefined ||
        stepForm.displayOrder === undefined
      ) {
        toast.warn("Vui lòng nhập đầy đủ các giá trị bước");
        return;
      }
      if (editingStep) {
        const res = await templateStepService.update(
          editingStep.id,
          stepForm as TemplateStepRequest,
        );
        if (res.success) {
          toast.success("Cập nhật bước thành công");
          const reload = await templateStepService.getByTemplateId(
            selectedTemplate!.id,
          );
          setTemplateSteps(
            (reload.data || []).sort((a, b) => a.displayOrder - b.displayOrder),
          );
          setEditingStep(null);
        } else {
          toast.error(res.message || "Cập nhật bước thất bại");
        }
      } else {
        const res = await templateStepService.create(
          stepForm as TemplateStepRequest,
        );
        if (res.success) {
          toast.success("Thêm bước thành công");
          const reload = await templateStepService.getByTemplateId(
            selectedTemplate!.id,
          );
          setTemplateSteps(
            (reload.data || []).sort((a, b) => a.displayOrder - b.displayOrder),
          );
          setStepForm({
            minItems: 0,
            maxItems: 1,
            defaultQty: 1,
            displayOrder: 1,
            templateId: selectedTemplate!.id,
            categoryId: categories[0]?.id || "",
          });
        } else {
          toast.error(res.message || "Thêm bước thất bại");
        }
      }
    } catch (err) {
      console.error("Save step error", err);
      toast.error("Lưu bước thất bại");
    }
  };

  const deleteStep = async (s: TemplateStep) => {
    const ok = confirm(`Xóa bước #${s.displayOrder}?`);
    if (!ok) return;
    try {
      const res = await templateStepService.delete(s.id);
      if (res.success) {
        toast.success("Xóa bước thành công");
        const reload = await templateStepService.getByTemplateId(
          selectedTemplate!.id,
        );
        setTemplateSteps(
          (reload.data || []).sort((a, b) => a.displayOrder - b.displayOrder),
        );
      } else {
        toast.error(res.message || "Xóa bước thất bại");
      }
    } catch (err) {
      console.error("Delete step error", err);
      toast.error("Xóa bước thất bại");
    }
  };

  const getStatusBadge = (t: BowlTemplate) => {
    const active = getIsActive(t);
    const cls = active
      ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
      : "inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700";
    return <span className={cls}>{active ? "Active" : "Inactive"}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bowl Templates</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage bowl templates and their steps
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AdminSearchBar
            placeholder="Search templates..."
            value={search}
            onChange={handleSearch}
          />
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${!showInactive ? "font-medium text-green-600" : "text-gray-500"}`}
            >
              Active
            </span>
            <button
              onClick={() => {
                setShowInactive(!showInactive);
                setPage(1);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showInactive ? "bg-red-600" : "bg-green-600"
              }`}
              aria-label="Toggle Active/Inactive"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showInactive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${showInactive ? "font-medium text-red-600" : "text-gray-500"}`}
            >
              Inactive
            </span>
          </div>
          <button
            onClick={openCreateTemplate}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Add Template
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Image
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name <span className="text-sm">{getSortIcon("name")}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                  onClick={() => handleSort("active")}
                >
                  <div className="flex items-center gap-1">
                    Status{" "}
                    <span className="text-sm">{getSortIcon("active")}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                Array.from({ length: Math.min(pageSize, 8) }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4">
                      <div className="h-20 w-20 animate-pulse rounded-lg bg-gray-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="h-8 w-36 animate-pulse rounded bg-gray-200" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : templates.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-600"
                  >
                    <div className="flex flex-col items-center">
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-xl">📄</span>
                      </div>
                      <div className="text-lg font-semibold">
                        Không có Template nào
                      </div>
                      <div className="text-sm">
                        Hãy thêm bowl template mới để bắt đầu.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {t.imageUrl &&
                      t.imageUrl !== "string" &&
                      (t.imageUrl.startsWith("http://") ||
                        t.imageUrl.startsWith("https://") ||
                        t.imageUrl.startsWith("/")) ? (
                        <ImageWithFallback
                          src={getFirebaseThumbnail(t.imageUrl)}
                          alt={t.name}
                          width={80}
                          height={80}
                          style={{ width: '80px', height: '80px' }}
                          className="rounded-lg object-cover"
                          fallbackSrc="/icon.svg"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200">
                          <span className="text-sm text-gray-400">No img</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {t.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {t.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{getStatusBadge(t)}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {t.active === false ? (
                        <button
                          onClick={() => handleRestore(t.id)}
                          className="mr-4 text-green-600 hover:text-green-900"
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditTemplate(t)}
                            className="mr-4 text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openStepsModal(t)}
                            className="mr-4 text-purple-600 hover:text-purple-900"
                          >
                            Steps
                          </button>
                          <button
                            onClick={() => handleSoftDelete(t.id)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Soft Delete
                          </button>
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
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </div>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowTemplateModal(false)}
            />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="mb-4 text-lg font-medium text-gray-900">
                  {isEditTemplate ? "Edit Template" : "Add New Template"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={templateForm.name}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={templateForm.description || ""}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Image
                    </label>
                    <FirebaseImageUpload
                      value={templateForm.imageUrl || ""}
                      onChange={(url: string) =>
                        setTemplateForm({ ...templateForm, imageUrl: url })
                      }
                      folder="bowl-templates"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Active
                    </label>
                    <input
                      type="checkbox"
                      checked={(templateForm.active ?? true) === true}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          active: e.target.checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="inline-flex w-full justify-center rounded-md bg-green-600 px-4 py-2 text-white shadow-sm hover:bg-green-700 sm:ml-3 sm:w-auto"
                >
                  {isEditTemplate ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStepsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeStepsModal}
            />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="mb-4 text-lg font-medium text-gray-900">
                  Template Steps
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={stepForm.categoryId || ""}
                        onChange={(e) =>
                          setStepForm({
                            ...stepForm,
                            categoryId: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={stepForm.displayOrder ?? 1}
                        onChange={(e) =>
                          setStepForm({
                            ...stepForm,
                            displayOrder: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Min Items
                      </label>
                      <input
                        type="number"
                        value={stepForm.minItems ?? 0}
                        onChange={(e) =>
                          setStepForm({
                            ...stepForm,
                            minItems: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Max Items
                      </label>
                      <input
                        type="number"
                        value={stepForm.maxItems ?? 1}
                        onChange={(e) =>
                          setStepForm({
                            ...stepForm,
                            maxItems: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Default Qty
                      </label>
                      <input
                        type="number"
                        value={stepForm.defaultQty ?? 1}
                        onChange={(e) =>
                          setStepForm({
                            ...stepForm,
                            defaultQty: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={saveStep}
                  className="inline-flex w-full justify-center rounded-md bg-green-600 px-4 py-2 text-white shadow-sm hover:bg-green-700 sm:ml-3 sm:w-auto"
                >
                  {editingStep ? "Update Step" : "Add Step"}
                </button>
                <button
                  type="button"
                  onClick={closeStepsModal}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>

              <div className="px-6 pb-6">
                {stepsLoading ? (
                  <div className="text-center text-gray-500">
                    Loading steps...
                  </div>
                ) : templateSteps.length === 0 ? (
                  <div className="text-center text-gray-600">
                    No steps for this template
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Order
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Category
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Min
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Max
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Default
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {templateSteps.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2">{s.displayOrder}</td>
                          <td className="px-4 py-2">
                            {categories.find((c) => c.id === s.categoryId)
                              ?.name || s.categoryId}
                          </td>
                          <td className="px-4 py-2">{s.minItems}</td>
                          <td className="px-4 py-2">{s.maxItems}</td>
                          <td className="px-4 py-2">{s.defaultQty}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => {
                                setEditingStep(s);
                                setStepForm({ ...s });
                              }}
                              className="mr-4 text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteStep(s)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
