'use client';

import React, { useState, useEffect } from 'react';
import { 
  bowlTemplateService, 
  templateStepService, 
  categoryService, 
  ingredientService 
} from '@/services';
import { orderService, bowlService, paymentService } from '@/services';
import { toast } from 'react-toastify';
import { BowlTemplate, TemplateStep, Category, Ingredient, BowlItem } from '@/types/api.types';

export default function MenuPage() {
  const [templates, setTemplates] = useState<BowlTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BowlTemplate | null>(null);
  const [templateSteps, setTemplateSteps] = useState<TemplateStep[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [bowlId, setBowlId] = useState<string>('');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [stepSelections, setStepSelections] = useState<Record<string, { ingredientIds: string[] }>>({});
  const [stepIngredients, setStepIngredients] = useState<Ingredient[]>([]);
  const [isAllStepsDone, setIsAllStepsDone] = useState<boolean>(false);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [bowlLinePrice, setBowlLinePrice] = useState<number>(0);
  const [bowlItems, setBowlItems] = useState<BowlItem[]>([]);

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const [templatesRes, categoriesRes] = await Promise.all([
        bowlTemplateService.getAll({ page: 0, size: 100 }),
        categoryService.getAll({ page: 0, size: 200 })
      ]);

      if (templatesRes.data) {
        setTemplates((templatesRes.data.content || []) as any);
      }
      if (categoriesRes.data) {
        setCategories(((categoriesRes.data as any).content || categoriesRes.data) as any);
      }
    } catch (err) {
      setError('Failed to load menu data');
      console.error('Error loading menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (template: BowlTemplate) => {
    setSelectedTemplate(template);
    try {
      const stepsRes = await templateStepService.getByTemplateId(template.id);
      if (stepsRes.success) {
        // Sort by displayOrder for guided flow
        const sorted = [...stepsRes.data].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setTemplateSteps(sorted);
      }
    } catch (err) {
      console.error('Error loading template steps:', err);
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    try {
      const ingredientsArr = await ingredientService.getByCategory(categoryId);
      setIngredients(ingredientsArr);
    } catch (err) {
      console.error('Error loading ingredients:', err);
    }
  };

  const startCustomizing = async () => {
    try {
      if (!selectedTemplate) {
        toast.error('Vui lòng chọn một template trước.');
        return;
      }
      if (!templateSteps.length) {
        toast.error('Template này chưa có bước cấu hình.');
        return;
      }

      // Require a storeId from storage (configured elsewhere in your app)
      const storeId = typeof window !== 'undefined' ? localStorage.getItem('storeId') || '' : '';
      if (!storeId) {
        setError('Chưa chọn cửa hàng. Vui lòng chọn store trước khi tạo order.');
        toast.error('Chưa chọn cửa hàng.');
        return;
      }

      // Read userId from cookie (set on login)
      const userCookie = typeof document !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('user='))?.split('=')[1] : undefined;
      const parsedUser = userCookie ? JSON.parse(decodeURIComponent(userCookie)) : undefined;
      const userId = parsedUser?.id || '';
      if (!userId) {
        toast.error('Bạn cần đăng nhập để tạo đơn hàng.');
        return;
      }

      // Create Order first
      const pickupAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const orderRes = await orderService.create({ storeId, pickupAt, note: '', userId });
      if (!orderRes.success) {
        toast.error(orderRes.message || 'Không thể tạo Order');
        return;
      }
      setOrderId(orderRes.data.id);

      // Create Bowl for selected template
      const bowlRes = await bowlService.create({
        orderId: orderRes.data.id,
        templateId: selectedTemplate.id,
        name: selectedTemplate.name,
        instruction: ''
      });
      if (!bowlRes.success) {
        toast.error(bowlRes.message || 'Không thể tạo Bowl');
        return;
      }
      setBowlId(bowlRes.data.id);

      // Initialize step flow
      const firstStep = templateSteps[0];
      setCurrentStepIndex(0);
      setSelectedCategory(firstStep.categoryId);

      // load ingredients for first step
      const ingredientsArr = await ingredientService.getByCategory(firstStep.categoryId);
      setStepIngredients(ingredientsArr);
      toast.success('Bắt đầu tùy chỉnh bowl của bạn!');
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi khi bắt đầu tùy chỉnh.');
    }
  };

  const loadIngredientsForStep = async (step: TemplateStep) => {
    try {
      const arr = await ingredientService.getByCategory(step.categoryId);
      setStepIngredients(arr);
    } catch (e) {
      console.error('Error loading ingredients for step:', e);
      setStepIngredients([]);
    }
  };

  const handleAddIngredientToBowl = async (ingredient: Ingredient) => {
    try {
      if (!bowlId || currentStepIndex < 0) {
        toast.error('Chưa khởi tạo bowl.');
        return;
      }
      const step = templateSteps[currentStepIndex];
      const key = step.id;
      const existing = stepSelections[key]?.ingredientIds || [];
      if (existing.length >= (step.maxItems || 0)) {
        toast.warn('Bạn đã đạt số lượng tối đa cho bước này.');
        return;
      }

      const quantity = step.defaultQty || 0;
      const res = await bowlService.createItem({
        bowlId,
        ingredientId: ingredient.id as string,
        quantity,
        unitPrice: ingredient.unitPrice
      });
      if (!res.success) {
        toast.error(res.message || 'Không thể thêm nguyên liệu.');
        return;
      }

      setStepSelections(prev => ({
        ...prev,
        [key]: { ingredientIds: [...existing, ingredient.id as string] }
      }));
      if (orderId) {
        try { await orderService.recalculate(orderId); } catch {}
      }
      await Promise.all([refreshOrderAndBowl(), loadBowlItems()]);
      toast.success('Đã thêm nguyên liệu.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Không thể thêm nguyên liệu.';
      toast.error(msg);
    }
  };

  const loadBowlItems = async () => {
    try {
      const all = await bowlService.getAllItems();
      if (all.success && bowlId) {
        const items = (all.data || []).filter((it: BowlItem) => it.bowlId === bowlId);
        setBowlItems(items);
      } else {
        setBowlItems([]);
      }
    } catch {
      setBowlItems([]);
    }
  };

  const handleRemoveBowlItem = async (itemId: string) => {
    try {
      await bowlService.deleteItem(itemId);
      if (orderId) {
        try { await orderService.recalculate(orderId); } catch {}
      }
      await Promise.all([refreshOrderAndBowl(), loadBowlItems()]);
      toast.success('Đã xóa nguyên liệu.');
    } catch {
      toast.error('Không thể xóa nguyên liệu.');
    }
  };

  const handleUpdateItemQty = async (item: BowlItem, newQty: number) => {
    try {
      const payload: any = { quantity: newQty, bowlId: item.bowlId, ingredientId: item.ingredientId, unitPrice: item.unitPrice };
      await bowlService.updateItem(item.id, payload);
      if (orderId) {
        try { await orderService.recalculate(orderId); } catch {}
      }
      await Promise.all([refreshOrderAndBowl(), loadBowlItems()]);
      toast.success('Đã cập nhật số lượng.');
    } catch {
      toast.error('Không thể cập nhật số lượng.');
    }
  };

  const refreshOrderAndBowl = async () => {
    try {
      if (bowlId) {
        const bowlRes = await bowlService.getById(bowlId);
        if (bowlRes.success) setBowlLinePrice(bowlRes.data.linePrice || 0);
      }
      if (orderId) {
        const orderRes = await orderService.getById(orderId);
        if (orderRes.success) setOrderTotal(orderRes.data.totalAmount || 0);
      }
    } catch {}
  };

  const canProceed = () => {
    if (currentStepIndex < 0) return false;
    const step = templateSteps[currentStepIndex];
    const selectedCount = stepSelections[step.id]?.ingredientIds.length || 0;
    return selectedCount >= (step.minItems || 0);
  };

  const handleNextStep = async () => {
    if (!canProceed()) {
      toast.warn('Vui lòng chọn đủ số lượng nguyên liệu tối thiểu.');
      return;
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= templateSteps.length) {
      setIsAllStepsDone(true);
      // Recalculate order totals (optional if backend auto-calculates)
      if (orderId) {
        try {
          await orderService.recalculate(orderId);
          await refreshOrderAndBowl();
        } catch {}
      }
      toast.success('Đã hoàn tất các bước. Bạn có thể xác nhận và thanh toán.');
      return;
    }
    const nextStep = templateSteps[nextIndex];
    setCurrentStepIndex(nextIndex);
    setSelectedCategory(nextStep.categoryId);
    await loadIngredientsForStep(nextStep);
  };

  const handlePrevStep = async () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex < 0) return;
    const prevStep = templateSteps[prevIndex];
    setCurrentStepIndex(prevIndex);
    setSelectedCategory(prevStep.categoryId);
    await loadIngredientsForStep(prevStep);
  };

  const handleConfirmOrder = async () => {
    try {
      if (!orderId) return;
      const res = await orderService.confirm(orderId);
      if (res.success) {
        toast.success('Đơn hàng đã được xác nhận.');
        // After confirm, fetch to get total amount
        const refreshed = await orderService.getById(orderId);
        if (refreshed.success) setOrderTotal(refreshed.data.totalAmount || 0);
      } else {
        toast.error(res.message || 'Xác nhận đơn thất bại');
      }
    } catch (e) {
      toast.error('Xác nhận đơn thất bại');
    }
  };

  const handleCreatePayment = async () => {
    try {
      if (!orderId) return;
      // Ensure total
      let amount = orderTotal;
      if (!amount) {
        const orRes = await orderService.getById(orderId);
        if (orRes.success) amount = orRes.data.totalAmount || 0;
        else amount = 0;
      }
      if (!amount || amount <= 0) {
        toast.error('Tổng tiền chưa sẵn sàng. Hãy xác nhận đơn trước.');
        return;
      }
      const payRes = await paymentService.processPayment(orderId, 'VNPAY', amount);
      if (payRes.success) {
        toast.success('Tạo giao dịch thanh toán thành công. Đang chuyển hướng...');
        const url = (payRes as any).data?.paymentUrl || '';
        if (url) window.location.href = url;
        else toast.info('Thanh toán được tạo nhưng không nhận được paymentUrl.');
      } else {
        toast.error(payRes.message || 'Không thể tạo giao dịch thanh toán');
      }
    } catch (e) {
      toast.error('Không thể tạo giao dịch thanh toán');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button 
            onClick={loadMenuData}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h1>
          <p className="text-xl text-gray-600">Choose your perfect bowl and customize it to your taste</p>
        </div>

        {/* Bowl Templates Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Bowl Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-green-500' : ''
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    template.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {template.active ? 'Available' : 'Unavailable'}
                  </span>
                  <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                    Customize
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Steps Section - Guided Flow */}
        {selectedTemplate && templateSteps.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Customize Your {selectedTemplate.name}
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              {currentStepIndex === -1 ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Sẵn sàng bắt đầu tùy chỉnh theo từng bước.</p>
                  <button onClick={startCustomizing} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Bắt đầu</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">Bước {currentStepIndex + 1} / {templateSteps.length}</div>
                    <div className="text-sm text-gray-600">Order: {orderId ? orderId.slice(0, 8) : '-'} • Bowl: {bowlId ? bowlId.slice(0, 8) : '-'}</div>
                  </div>
                  {isAllStepsDone ? (
                    <div className="text-center py-8">
                      <p className="text-lg text-gray-800 mb-4">Bạn đã hoàn tất các bước.</p>
                      <div className="mb-4 text-gray-700">Tổng tiền: {orderTotal ? orderTotal.toLocaleString('vi-VN') : '0'} đ</div>
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={handleConfirmOrder} className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Xác nhận đơn</button>
                        <button onClick={handleCreatePayment} className="px-5 py-2 border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50">Thanh toán</button>
                      </div>
                    </div>
                  ) : (
                  <>
                  <div className="border rounded-lg p-4 mb-6">
                    {(() => {
                      const step = templateSteps[currentStepIndex];
                      const categoryName = categories.find(c => c.id === step.categoryId)?.name || 'Danh mục';
                      const selectedCount = stepSelections[step.id]?.ingredientIds.length || 0;
                      return (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Step {step.displayOrder}: {categoryName}</h3>
                          <p className="text-sm text-gray-600 mb-2">Chọn {step.minItems}-{step.maxItems} nguyên liệu • Đã chọn: {selectedCount}</p>
                          <p className="text-sm text-gray-500">Mặc định: {step.defaultQty}{'g'}</p>
                        </>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stepIngredients.map(ing => (
                      <div key={ing.id} className="border rounded-lg p-4 flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{ing.name}</h4>
                          <p className="text-sm text-gray-600">Unit: {ing.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-600 font-semibold">${ing.unitPrice.toFixed(2)}/{ing.unit}</p>
                          <button onClick={() => handleAddIngredientToBowl(ing)} className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors">Thêm</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Đã chọn</h4>
                    {bowlItems.length ? (
                      <div className="space-y-2">
                        {bowlItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{item.ingredientId}</span>
                              <input
                                type="number"
                                min={0}
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQty(item, Math.max(0, Number(e.target.value) || 0))}
                                className="w-20 px-2 py-1 border rounded"
                              />
                            </div>
                            <button onClick={() => handleRemoveBowlItem(item.id)} className="px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 text-sm">Xóa</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Chưa có nguyên liệu nào được thêm.</p>
                    )}
                  </div>
                  <div className="mt-4 text-right text-gray-700">Tạm tính bowl: {bowlLinePrice ? bowlLinePrice.toLocaleString('vi-VN') : '0'} đ</div>
                  <div className="flex items-center justify-between mt-6">
                    <button onClick={handlePrevStep} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50" disabled={currentStepIndex <= 0}>Quay lại</button>
                    <button onClick={handleNextStep} className={`px-4 py-2 rounded-lg text-white ${canProceed() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`} disabled={!canProceed()}>Tiếp tục</button>
                  </div>
                  </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Categories and Ingredients Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Categories</h2>
            <div className="space-y-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">Type: {category.kind}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ingredients</h2>
            {selectedCategory ? (
              <div className="space-y-3">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{ingredient.name}</h3>
                        <p className="text-sm text-gray-600">Unit: {ingredient.unit || ''}</p>
                        {(ingredient.nutrition && (ingredient.nutrition.calories != null || ingredient.nutrition.protein != null)) && (
                          <div className="mt-2 text-sm text-gray-500">
                            <span>Calories: {ingredient.nutrition.calories ?? 0}</span>
                            <span className="ml-4">Protein: {ingredient.nutrition.protein ?? 0}g</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          ${ingredient.unitPrice?.toFixed(2) ?? '0.00'}/{ingredient.unit || ''}
                        </p>
                        <button className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors">
                          Add to Bowl
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Select a category to view ingredients</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 text-center">
          <button onClick={startCustomizing} className="px-8 py-3 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 transition-colors mr-4">
            Start Customizing
          </button>
          <button className="px-8 py-3 border border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            View All Ingredients
          </button>
        </div>
      </div>
    </div>
  );
}
