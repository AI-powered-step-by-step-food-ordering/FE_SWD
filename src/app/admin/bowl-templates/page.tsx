'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminSearchBar from '@/components/admin/AdminSearchBar';
import Pagination from '@/components/admin/Pagination';
import { toast } from 'react-toastify';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import bowlTemplateService from '@/services/bowlTemplate.service';
import templateStepService from '@/services/templateStep.service';
import categoryService from '@/services/category.service';
import type {
  BowlTemplate,
  BowlTemplateRequest,
  TemplateStep,
  TemplateStepRequest,
  Category,
} from '@/types/api.types';

export default function BowlTemplatesAdminPage() {
  useRequireAdmin();

  // Core state
  const [templates, setTemplates] = useState<BowlTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Search & pagination
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showInactive, setShowInactive] = useState<boolean>(false);

  // Create/Edit Template modal
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [isEditTemplate, setIsEditTemplate] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BowlTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<BowlTemplateRequest>({
    name: '',
    description: '',
    isActive: true,
  });

  // Steps management
  const [showStepsModal, setShowStepsModal] = useState<boolean>(false);
  const [stepsLoading, setStepsLoading] = useState<boolean>(false);
  const [templateSteps, setTemplateSteps] = useState<TemplateStep[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stepForm, setStepForm] = useState<Partial<TemplateStepRequest>>({
    minItems: 0,
    maxItems: 1,
    defaultQty: 1,
    displayOrder: 1,
    templateId: '',
    categoryId: '',
  });
  const [editingStep, setEditingStep] = useState<TemplateStep | null>(null);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await bowlTemplateService.getAll();
        setTemplates(res.data || []);
        // Preload categories for Step form
        const catRes = await categoryService.getAll();
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('Failed to load templates', err);
        setError('Không thể tải danh sách bowl templates');
        toast.error('Tải bowl templates thất bại');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Derived data
  const getIsActive = (t: BowlTemplate) => (t.isActive ?? t.active) === true;

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates
      .filter((t) => (showInactive ? !getIsActive(t) : getIsActive(t)))
      .filter((t) => {
        if (!q) return true;
        const name = t.name?.toLowerCase() || '';
        const desc = t.description?.toLowerCase() || '';
        const id = t.id?.toLowerCase() || '';
        return name.includes(q) || desc.includes(q) || id.includes(q);
      });
  }, [templates, search, showInactive]);

  const startIndex = (page - 1) * pageSize;
  const pagedTemplates = filteredTemplates.slice(startIndex, startIndex + pageSize);

  // Template modal helpers
  const resetTemplateForm = () => {
    setTemplateForm({ name: '', description: '', isActive: true });
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
      name: t.name || '',
      description: t.description || '',
      isActive: getIsActive(t),
    });
    setIsEditTemplate(true);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.name?.trim()) {
        toast.warn('Tên template là bắt buộc');
        return;
      }

      const payload: BowlTemplateRequest = {
        name: templateForm.name,
        description: templateForm.description || '',
        isActive: !!templateForm.isActive,
        active: !!templateForm.isActive,
      };

      if (isEditTemplate && selectedTemplate?.id) {
        const res = await bowlTemplateService.update(selectedTemplate.id, payload);
        if (res.success) {
          toast.success('Cập nhật bowl template thành công');
          // refresh list
          const all = await bowlTemplateService.getAll();
          setTemplates(all.data || []);
          setShowTemplateModal(false);
          resetTemplateForm();
        } else {
          toast.error(res.message || 'Cập nhật thất bại');
        }
      } else {
        const res = await bowlTemplateService.create(payload);
        if (res.success) {
          toast.success('Tạo bowl template thành công');
          const all = await bowlTemplateService.getAll();
          setTemplates(all.data || []);
          setShowTemplateModal(false);
          resetTemplateForm();
        } else {
          toast.error(res.message || 'Tạo mới thất bại');
        }
      }
    } catch (err) {
      console.error('Save template error', err);
      toast.error('Lưu bowl template thất bại');
    }
  };

  const handleDeleteTemplate = async (t: BowlTemplate) => {
    const ok = confirm(`Xóa bowl template "${t.name}"?`);
    if (!ok) return;
    try {
      const res = await bowlTemplateService.delete(t.id);
      if (res.success) {
        toast.success('Xóa bowl template thành công');
        const all = await bowlTemplateService.getAll();
        setTemplates(all.data || []);
      } else {
        toast.error(res.message || 'Xóa thất bại');
      }
    } catch (err) {
      console.error('Delete template error', err);
      toast.error('Xóa bowl template thất bại');
    }
  };

  // Steps modal helpers
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
      categoryId: categories[0]?.id || '',
    });
    try {
      // Load steps for selected template via template-step-controller
      const res = await templateStepService.getByTemplateId(t.id);
      const steps = (res.data || []).sort((a, b) => a.displayOrder - b.displayOrder);
      setTemplateSteps(steps);
    } catch (err) {
      console.error('Load steps error', err);
      toast.error('Tải Template Steps thất bại');
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
        toast.warn('Vui lòng chọn Template và Category');
        return;
      }
      if (
        stepForm.minItems === undefined ||
        stepForm.maxItems === undefined ||
        stepForm.defaultQty === undefined ||
        stepForm.displayOrder === undefined
      ) {
        toast.warn('Vui lòng nhập đầy đủ các giá trị bước');
        return;
      }

      if (editingStep) {
        const res = await templateStepService.update(editingStep.id, stepForm as TemplateStepRequest);
        if (res.success) {
          toast.success('Cập nhật bước thành công');
          const reload = await templateStepService.getByTemplateId(selectedTemplate!.id);
          setTemplateSteps((reload.data || []).sort((a, b) => a.displayOrder - b.displayOrder));
          setEditingStep(null);
        } else {
          toast.error(res.message || 'Cập nhật bước thất bại');
        }
      } else {
        const res = await templateStepService.create(stepForm as TemplateStepRequest);
        if (res.success) {
          toast.success('Thêm bước thành công');
          const reload = await templateStepService.getByTemplateId(selectedTemplate!.id);
          setTemplateSteps((reload.data || []).sort((a, b) => a.displayOrder - b.displayOrder));
        } else {
          toast.error(res.message || 'Thêm bước thất bại');
        }
      }
    } catch (err) {
      console.error('Save step error', err);
      toast.error('Lưu bước thất bại');
    }
  };

  const editStep = (step: TemplateStep) => {
    setEditingStep(step);
    setStepForm({
      minItems: step.minItems,
      maxItems: step.maxItems,
      defaultQty: step.defaultQty,
      displayOrder: step.displayOrder,
      templateId: step.templateId,
      categoryId: step.categoryId,
    });
  };

  const deleteStep = async (step: TemplateStep) => {
    const ok = confirm('Xóa bước này?');
    if (!ok) return;
    try {
      const res = await templateStepService.delete(step.id);
      if (res.success) {
        toast.success('Xóa bước thành công');
        const reload = await templateStepService.getByTemplateId(selectedTemplate!.id);
        setTemplateSteps((reload.data || []).sort((a, b) => a.displayOrder - b.displayOrder));
      } else {
        toast.error(res.message || 'Xóa bước thất bại');
      }
    } catch (err) {
      console.error('Delete step error', err);
      toast.error('Xóa bước thất bại');
    }
  };

  return (
    <AdminLayout title="Bowl Templates Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bowl Templates</h2>
            <p className="mt-1 text-sm text-gray-600">Quản lý mẫu tô (bowl templates) và các bước lựa chọn</p>
          </div>
          <div className="flex items-center gap-4">
            <AdminSearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm template..." />
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!showInactive ? 'font-medium text-green-600' : 'text-gray-500'}`}>Active</span>
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showInactive ? 'bg-gray-300' : 'bg-green-500'}`}
                aria-pressed={!showInactive}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showInactive ? 'translate-x-6' : 'translate-x-1'}`}/>
              </button>
              <span className={`text-sm ${showInactive ? 'font-medium text-gray-700' : 'text-gray-500'}`}>Inactive</span>
            </div>
            <button
              onClick={openCreateTemplate}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Thêm Template</span>
            </button>
          </div>
        </div>

        {/* Table/List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Không có dữ liệu</td>
                </tr>
              ) : (
                pagedTemplates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{t.name}</div>
                      <div className="text-gray-500 text-xs font-mono">ID: {t.id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{t.description || '-'}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const active = getIsActive(t);
                        return (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditTemplate(t)}
                          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => openStepsModal(t)}
                          className="px-3 py-1.5 text-sm rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          Bước (Steps)
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(t)}
                          className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalItems={filteredTemplates.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-lg">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">{isEditTemplate ? 'Sửa Bowl Template' : 'Thêm Bowl Template'}</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Ví dụ: Classic Bowl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <textarea
                    value={templateForm.description || ''}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    rows={3}
                    placeholder="Mô tả ngắn..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Kích hoạt (Active)</label>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => { setShowTemplateModal(false); resetTemplateForm(); }}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
                >
                  Đóng
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Steps Modal */}
        {showStepsModal && selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Quản lý Steps - {selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600">Thêm/sửa/xóa các bước chọn thành phần cho template</p>
                </div>
                <button
                  onClick={closeStepsModal}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
                >Đóng</button>
              </div>

              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Form */}
                <div className="md:col-span-1">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={stepForm.categoryId || ''}
                        onChange={(e) => setStepForm({ ...stepForm, categoryId: e.target.value })}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.kind})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Min Items</label>
                        <input
                          type="number"
                          value={stepForm.minItems || 0}
                          onChange={(e) => setStepForm({ ...stepForm, minItems: Number(e.target.value) })}
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Items</label>
                        <input
                          type="number"
                          value={stepForm.maxItems || 1}
                          onChange={(e) => setStepForm({ ...stepForm, maxItems: Number(e.target.value) })}
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Default Qty</label>
                        <input
                          type="number"
                          value={stepForm.defaultQty || 1}
                          onChange={(e) => setStepForm({ ...stepForm, defaultQty: Number(e.target.value) })}
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Display Order</label>
                        <input
                          type="number"
                          value={stepForm.displayOrder || 1}
                          onChange={(e) => setStepForm({ ...stepForm, displayOrder: Number(e.target.value) })}
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      {editingStep && (
                        <button
                          onClick={() => { setEditingStep(null); setStepForm({ ...stepForm, minItems: 0, maxItems: 1, defaultQty: 1, displayOrder: 1 }); }}
                          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
                        >Hủy sửa</button>
                      )}
                      <button
                        onClick={saveStep}
                        className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                      >{editingStep ? 'Cập nhật bước' : 'Thêm bước'}</button>
                    </div>
                  </div>
                </div>

                {/* Steps list */}
                <div className="md:col-span-2">
                  <div className="bg-white border rounded-md">
                    <div className="px-4 py-2 border-b flex items-center justify-between">
                      <h4 className="font-medium">Danh sách Steps</h4>
                      {stepsLoading && <span className="text-sm text-gray-500">Đang tải...</span>}
                    </div>
                    <div className="divide-y">
                      {templateSteps.length === 0 ? (
                        <div className="px-4 py-3 text-gray-500">Chưa có bước nào</div>
                      ) : (
                        templateSteps.map((s) => (
                          <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                            <div>
                              <div className="text-gray-900 font-medium">Bước #{s.displayOrder}</div>
                              <div className="text-sm text-gray-600">
                                Category: {categories.find(c => c.id === s.categoryId)?.name || s.categoryId}
                              </div>
                              <div className="text-sm text-gray-600">Min: {s.minItems} - Max: {s.maxItems} - Default Qty: {s.defaultQty}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => editStep(s)}
                                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
                              >Sửa</button>
                              <button
                                onClick={() => deleteStep(s)}
                                className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                              >Xóa</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}