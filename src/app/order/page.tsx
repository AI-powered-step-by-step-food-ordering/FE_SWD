'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { 
  bowlTemplateService,
  templateStepService,
  categoryService,
  ingredientService,
  orderService,
  bowlService,
  paymentService,
  storeService
} from '@/services';
import { BowlTemplate, TemplateStep, Category, Ingredient, BowlItem, Store } from '@/types/api.types';
import apiClient from '@/services/api.config';
import Header from '@/components/shared/Header';
import ProgressBar from '@/components/order/ProgressBar';
import FoodSelection from '@/components/order/FoodSelection';
import NutritionPanel from '@/components/order/NutritionPanel';

function useInitOrderPage(
  setTemplates: React.Dispatch<React.SetStateAction<BowlTemplate[]>>,
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
  setStores: React.Dispatch<React.SetStateAction<Store[]>>,
  setSelectedStoreId: React.Dispatch<React.SetStateAction<string>>,
  setPageLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: { error: (msg: string) => void }
) {
  return async () => {
    try {
      setPageLoading(true);
      const [tpls, cats, storesRes] = await Promise.all([
        bowlTemplateService.getAll(),
        categoryService.getAll(),
        storeService.getAll()
      ]);
      if (tpls.success) setTemplates(tpls.data);
      if (cats.success) setCategories(cats.data);
      if (storesRes.success) {
        setStores(storesRes.data);
        // Pick saved or first active
        const saved = typeof window !== 'undefined' ? localStorage.getItem('storeId') : '';
        const initial = saved || storesRes.data[0]?.id || '';
        if (initial) {
          setSelectedStoreId(initial);
          if (typeof window !== 'undefined') localStorage.setItem('storeId', initial);
        }
      }
    } catch (e) {
      toast.error('Không thể tải dữ liệu.');
    } finally { setPageLoading(false); }
  };
}

export default function OrderPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<BowlTemplate[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<BowlTemplate | null>(null);
  const [templateSteps, setTemplateSteps] = useState<TemplateStep[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stepIngredients, setStepIngredients] = useState<Ingredient[]>([]);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [stepSelections, setStepSelections] = useState<Record<string, string[]>>({});

  const [orderId, setOrderId] = useState('');
  const [bowlId, setBowlId] = useState('');
  const [bowlItems, setBowlItems] = useState<BowlItem[]>([]);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [bowlLinePrice, setBowlLinePrice] = useState<number>(0);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [stepLoading, setStepLoading] = useState<boolean>(false);
  // Toggle to send amount in cents if backend requires integer amounts
  const USE_CENTS_FOR_PAYMENT = false;
  // Payment method selection (must match BE enum)
  const [paymentMethod, setPaymentMethod] = useState<string>('TRANSFER');

  const init = useInitOrderPage(setTemplates, setCategories, setStores, setSelectedStoreId, setPageLoading, toast);
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // CHỈ chạy 1 lần khi mount, không phụ thuộc biến init nữa

  const onSelectTemplate = async (tpl: BowlTemplate) => {
    try {
      setSelectedTemplate(tpl);
      const stepsRes = await templateStepService.getByTemplateId(tpl.id);
      if (stepsRes.success) {
        const sorted = [...stepsRes.data].sort((a, b) => a.displayOrder - b.displayOrder);
        setTemplateSteps(sorted);
      }
    } catch {
      toast.error('Không thể tải bước template.');
    }
  };

  const startFlow = async () => {
    if (!selectedTemplate) {
      toast.warn('Hãy chọn template');
      return;
    }
    if (!templateSteps.length) {
      toast.warn('Template chưa có bước');
      return;
    }
    // read user & store
    const userCookie = document.cookie.split(';').find(c => c.trim().startsWith('user='))?.split('=')[1];
    const user = userCookie ? JSON.parse(decodeURIComponent(userCookie)) : null;
    const userId = user?.id;
    const storeId = selectedStoreId || localStorage.getItem('storeId') || '';
    if (!userId) { router.push('/auth/login?from=order'); return; }
    if (!storeId) { toast.error('Chưa chọn cửa hàng'); return; }

    const pickupAt = new Date(Date.now() + 60*60*1000).toISOString();
    const orderRes = await orderService.create({ storeId, userId, pickupAt, note: '' });
    if (!orderRes.success) { toast.error(orderRes.message || 'Không thể tạo Order'); return; }
    setOrderId(orderRes.data.id);

    const bowlRes = await bowlService.create({ orderId: orderRes.data.id, templateId: selectedTemplate.id, name: selectedTemplate.name, instruction: '' });
    if (!bowlRes.success) { toast.error(bowlRes.message || 'Không thể tạo Bowl'); return; }
    setBowlId(bowlRes.data.id);

    // load first step ingredients
    setCurrentStepIndex(0);
    const first = templateSteps[0];
    setStepLoading(true);
    let ings = await ingredientService.getByCategory(first.categoryId);
    // Fallback: nếu catalog chưa gắn categoryId cho ingredients, hiển thị tất cả
    if (!ings || ings.length === 0) {
      try {
        const all = await ingredientService.getAll();
        if (all.success) ings = all.data;
      } catch {}
    }
    setStepIngredients(ings || []);
    console.log('[STEP INGREDIENTS]:', ings);
    setStepLoading(false);
    toast.success('Bắt đầu đặt món');
  };

  const loadStepIngredients = async (step: TemplateStep) => {
    setStepLoading(true);
    let ings = await ingredientService.getByCategory(step.categoryId);
    if (!ings || ings.length === 0) {
      try {
        const all = await ingredientService.getAll();
        if (all.success) ings = all.data;
      } catch {}
    }
    setStepIngredients(ings || []);
    console.log('[INGREDIENTS]', ings);
    setStepLoading(false);
  };

  const addIngredient = async (ing: Ingredient) => {
    if (!bowlId || currentStepIndex < 0) return;
    const step = templateSteps[currentStepIndex];
    const picked = stepSelections[step.id] || [];
    if ((step.maxItems || 1) <= 0) {
      toast.error('Bước này chưa cấu hình số lượng tối đa cho món');
      return;
    }
    if (picked.length >= (step.maxItems || 1)) { toast.warn('Đã đạt số lượng tối đa'); return; }
    // Validate restrictions before add
    try {
      const v = await apiClient.post('/api/ingredient-restrictions/validate-addition', null, { params: { bowlId, ingredientId: ing.id } });
      const valid = v?.data?.data?.valid;
      if (valid === false) {
        const msg = v?.data?.data?.message || 'Vi phạm ràng buộc nguyên liệu';
        toast.error(msg);
        return;
      }
    } catch (_) {
      // If validation endpoint fails, continue to rely on backend error on create
    }
    const qty = step.defaultQty || 0;
    const res = await bowlService.createItem({ bowlId, ingredientId: ing.id, quantity: qty, unitPrice: ing.unitPrice });
    if (!res.success) { toast.error(res.message || 'Không thể thêm'); return; }
    setStepSelections(prev => ({ ...prev, [step.id]: [...picked, ing.id] }));
    try { await orderService.recalculate(orderId); } catch {}
    await refreshTotals();
  };

  const refreshTotals = async () => {
    try {
      if (bowlId) {
        const b = await bowlService.getById(bowlId);
        console.log('[REFRESH] Bowl getById:', b);
        if (b.success) setBowlLinePrice(b.data.linePrice || 0);
      }
      if (orderId) {
        const o = await orderService.getById(orderId);
        console.log('[REFRESH] Order getById:', o);
        if (o.success) setOrderTotal(o.data.totalAmount || 0);
      }
      const all = await bowlService.getAllItems();
      if (all.success && bowlId) setBowlItems((all.data || []).filter((i: BowlItem) => i.bowlId === bowlId));
    } catch {}
  };

  const removeItem = async (itemId: string) => {
    try {
      await bowlService.deleteItem(itemId);
      try { await orderService.recalculate(orderId); } catch {}
      await refreshTotals();
      toast.success('Đã xóa nguyên liệu');
    } catch {
      toast.error('Không thể xóa nguyên liệu');
    }
  };

  const updateItemQty = async (item: BowlItem, newQty: number) => {
    try {
      const payload: any = { quantity: newQty, bowlId: item.bowlId, ingredientId: item.ingredientId, unitPrice: item.unitPrice };
      await bowlService.updateItem(item.id, payload);
      try { await orderService.recalculate(orderId); } catch {}
      await refreshTotals();
      toast.success('Đã cập nhật số lượng');
    } catch {
      toast.error('Không thể cập nhật số lượng');
    }
  };

  const nextStep = async () => {
    const next = currentStepIndex + 1;
    if (next >= templateSteps.length) {
      toast.success('Hoàn tất bước. Xác nhận để thanh toán.');
      return;
    }
    setCurrentStepIndex(next);
    await loadStepIngredients(templateSteps[next]);
  };

  const prevStep = async () => {
    const prev = currentStepIndex - 1;
    if (prev < 0) return;
    setCurrentStepIndex(prev);
    await loadStepIngredients(templateSteps[prev]);
  };

  const confirmOrder = async () => {
    if (!orderId) return;
    const res = await orderService.confirm(orderId);
    if (res.success) { toast.success('Đã xác nhận đơn'); await refreshTotals(); }
    else toast.error(res.message || 'Xác nhận thất bại');
  };

  const pay = async () => {
    if (!orderId) return;
    const amount = Number((orderTotal || 0).toFixed(2));
    if (!amount) { toast.error('Tổng tiền chưa sẵn sàng'); return; }
    try {
      console.debug('[PAY] start', { orderId, orderTotal, amount, USE_CENTS_FOR_PAYMENT, paymentMethod });
      // Ensure order is confirmed before initiating payment
      try {
        const ord = await orderService.getById(orderId);
        const status = ord?.data?.status || (ord as any)?.data?.data?.status; // handle inconsistent shapes if any
        console.debug('[PAY] fetched order status', { status, ord });
        if (status && status !== 'CONFIRMED') {
          const conf = await orderService.confirm(orderId);
          console.debug('[PAY] confirm response', conf);
          if (!conf.success) {
            toast.warn('Đơn chưa thể xác nhận để thanh toán');
            return;
          }
        }
      } catch (_) {
        // If check fails silently continue; BE will validate again
        console.debug('[PAY] order status check failed, continue');
      }

      const amountPrimary = USE_CENTS_FOR_PAYMENT ? Math.round(amount * 100) : amount;
      const payloadPrimary = { orderId, method: paymentMethod, amount: amountPrimary, status: 'PENDING' };
      console.debug('[PAY] creating payment with payload', payloadPrimary);
      let pr = await paymentService.processPayment(orderId, paymentMethod, amountPrimary);
      console.debug('[PAY] create payment response', pr);
      if (pr.success) {
        const url = (pr as any).data?.paymentUrl;
        if (url) {
          window.location.href = url; 
        } else {
          toast.info('Payment created, no paymentUrl returned');
        }
      } else {
        // If server error and we used decimal, retry with cents (or vice versa)
        const shouldRetryWithCents = !USE_CENTS_FOR_PAYMENT;
        const isServerError = (pr as any)?.code >= 500 || (pr as any)?.message?.toLowerCase?.().includes('internal');
        if (shouldRetryWithCents && isServerError) {
          const amountRetry = Math.round(amount * 100);
          const payloadRetry = { orderId, method: paymentMethod, amount: amountRetry, status: 'PENDING' };
          console.debug('[PAY] retrying with cents payload', payloadRetry);
          pr = await paymentService.processPayment(orderId, paymentMethod, amountRetry);
          console.debug('[PAY] retry response', pr);
          if (pr.success) {
            const url = (pr as any).data?.paymentUrl;
            if (url) {
              window.location.href = url;
              return;
            }
          }
        }
        toast.error(pr.message || 'Không thể tạo thanh toán');
      }
    } catch (e: any) {
      const errData = e?.response?.data;
      const msg = errData?.message || e?.message || 'Lỗi máy chủ khi tạo thanh toán';
      toast.error(msg);
      console.error('[PAY] Payment create failed', {
        message: e?.message,
        status: e?.response?.status,
        url: e?.config?.url,
        method: e?.config?.method,
        data: errData,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Header totalPrice={orderTotal} totalCalories={0} showPriceInfo={true} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Order</h1>
        </div>

        {/* Store Selector */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Chọn cửa hàng</h2>
          {pageLoading ? (
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
          ) : stores.length ? (
            <div className="flex flex-wrap gap-3">
              {stores.map((s) => (
                  <button
                  key={s.id}
                  onClick={() => { setSelectedStoreId(s.id); localStorage.setItem('storeId', s.id); }}
                  className={`px-4 py-2 rounded border ${selectedStoreId===s.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                  <div className="font-medium">{s.name}</div>
                  </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Đang tải danh sách cửa hàng...</div>
          )}
        </div>

        {/* Templates */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Chọn Template</h2>
          {pageLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_,i)=>(<div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map(t => (
                <div key={t.id} className={`p-4 border rounded cursor-pointer ${selectedTemplate?.id===t.id?'border-green-500 bg-green-50':'border-gray-200'}`} onClick={() => onSelectTemplate(t)}>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-gray-600">{t.description}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <button onClick={startFlow} className="px-4 py-2 bg-green-600 text-white rounded">Bắt đầu</button>
          </div>
        </div>

        {/* Stepper */}
        {currentStepIndex >= 0 && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Steps and ingredients (2 cols) */}
            <div className="lg:col-span-2">
              <ProgressBar steps={templateSteps.map(s=>categories.find(c=>c.id===s.categoryId)?.name || `Step ${s.displayOrder}`)} currentStep={currentStepIndex+1} />
              <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                <div>Bước {currentStepIndex+1}/{templateSteps.length}</div>
                <div>Order: {orderId.slice(0,8)} • Bowl: {bowlId.slice(0,8)}</div>
              </div>
              <div className="p-4 border rounded mb-4 bg-white/70 backdrop-blur">
                {(() => {
                  const step = templateSteps[currentStepIndex];
                  const cat = categories.find(c=>c.id===step?.categoryId)?.name || '';
                  const count = (stepSelections[step.id]||[]).length;
                  return (
                    <>
                      <div className="font-semibold">Step {step.displayOrder}: {cat}</div>
                      <div className="text-sm text-gray-600">Chọn {step.minItems}-{step.maxItems} • Đã chọn: {count}</div>
                    </>
                  );
                })()}
              </div>
              {stepLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_,i)=>(<div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />))}
                </div>
              ) : (
                <FoodSelection
                  category={categories.find(c=>c.id===templateSteps[currentStepIndex]?.categoryId)?.name || 'Ingredients'}
                  items={stepIngredients.map(i=>({
                    id: i.id,
                    name: i.name,
                    price: i.unitPrice ?? 0,
                    nutrition: {
                      calories: i.nutrition?.calories ?? 0,
                      protein: i.nutrition?.protein ?? 0,
                      carbs: i.nutrition?.carbs ?? 0,
                      fat: i.nutrition?.fat ?? 0,
                    },
                    image: i.imageUrl || '🥗',
                    description: i.description || i.unit || ''
                  }))}
                  onItemSelect={(_, item)=>{
                    const ing = stepIngredients.find(ii=>ii.id===item.id);
                    if (ing) addIngredient(ing);
                  }}
                  onSkip={nextStep}
                />
              )}
              <div className="flex items-center justify-between mt-6">
                <button onClick={prevStep} className="px-4 py-2 border rounded hover:bg-white">Quay lại</button>
                <div className="text-right text-gray-700 font-medium">Tạm tính bowl: {bowlLinePrice.toLocaleString('vi-VN')} đ</div>
                <button onClick={nextStep} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Tiếp tục</button>
              </div>
            </div>

            {/* Right: Sticky summary (1 col) */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">
                <div className="p-4 border rounded bg-white/80 backdrop-blur">
                  <h3 className="font-semibold mb-3">Đã chọn</h3>
                  {bowlItems.length ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {bowlItems.map(it => (
                        <div key={it.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium truncate max-w-[120px]" title={it.ingredientId}>
                              {stepIngredients.find(i=>i.id===it.ingredientId)?.name || it.ingredientId}
                            </span>
                            <input type="number" min={0} value={it.quantity} onChange={(e)=>updateItemQty(it, Math.max(0, Number(e.target.value)||0))} className="w-20 px-2 py-1 border rounded" />
                          </div>
                          <button onClick={()=>removeItem(it.id)} className="px-3 py-1 text-red-600 border border-red-200 rounded text-sm">Xóa</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Chưa có nguyên liệu nào</div>
                  )}
                </div>
                <div className="p-4 border rounded bg-white/80 backdrop-blur">
                  <div className="mb-2 font-semibold">Tổng tiền</div>
                  <div className="text-2xl font-bold text-green-700 mb-4">{orderTotal.toLocaleString('vi-VN')} đ</div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                  <select
                    value={paymentMethod}
                    onChange={(e)=>setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="CARD">Thẻ (CARD)</option>
                    <option value="CASH">Tiền mặt (CASH)</option>
                    <option value="WALLET">Ví (WALLET)</option>
                    <option value="TRANSFER">Chuyển khoản (TRANSFER)</option>
                  </select>
                </div>
                  <div className="flex gap-3">
                    <button onClick={confirmOrder} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Xác nhận</button>
                    <button onClick={pay} className="flex-1 px-4 py-2 border border-emerald-600 text-emerald-700 rounded hover:bg-emerald-50">Thanh toán</button>
                  </div>
                </div>
                <NutritionPanel
                  currentNutrition={{ calories: 0, protein: 0, carbs: 0, fat: 0 }}
                  goals={{ type: 'maintenance', targetCalories: 0, targetProtein: 0, targetCarbs: 0, targetFat: 0 } as any}
                  currentStep={currentStepIndex+1}
                  onGoBack={prevStep}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}