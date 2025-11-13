'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { paymentService, zaloPayService } from '@/services';
import { BowlTemplate, TemplateStep, Category, Ingredient, BowlItem, Store, PaymentMethod } from '@/types/api.types';
// import apiClient from '@/services/api.config';
import Header from '@/components/shared/Header';
import { formatVND } from '@/lib/format-number';
import ProgressBar from '@/components/order/ProgressBar';
import FoodSelection from '@/components/order/FoodSelection';
import NutritionPanel from '@/components/order/NutritionPanel';
import { useOrderStore } from '@/store/order.store';

// local store-based init no longer needed

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    // state
    templates, categories, templateSteps, currentStepIndex, stepIngredients,
    stepSelections, orderId, bowlId, bowlItems, orderTotal, bowlLinePrice, loading,
    // actions
    hydrateInitial, setStore, setTemplate, gotoStep, nextStep, prevStep,
    addIngredient, removeItem, updateItemQty
  } = useOrderStore();
  const pageLoading = loading;
  const stepLoading = false;
  const selectedTemplate: BowlTemplate | null = useOrderStore(s => s.selectedTemplate);
  const selectedStoreId: string = useOrderStore(s => s.selectedStoreId);
  const stores: Store[] = useOrderStore(s => s.stores as any);
  // Toggle to send amount in cents if backend requires integer amounts
  const USE_CENTS_FOR_PAYMENT = false;
  // Payment method selection (must match BE enum)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ZALOPAY);

  useEffect(() => {
    hydrateInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // CHỈ chạy 1 lần khi mount, không phụ thuộc biến init nữa

  // Reorder param is ignored here to keep flow strictly on your Order page
  useEffect(() => {
    // Intentionally no-op: user builds the bowl on this page
    // respecting your existing selection logic/UI.
  }, [searchParams]);

  // Autofill selections from order-history via localStorage payload (disabled)
  useEffect(() => {
    // no-op after store refactor
  }, [selectedStoreId]);

  const onSelectTemplate = async (tpl: BowlTemplate) => { await setTemplate(tpl); };

  const startFlow = async () => { toast.success('Bắt đầu đặt món'); };

  const loadStepIngredients = async (step: TemplateStep) => { /* handled in store */ };

  const updateOrderTotals = async () => {};

  const addIngredientHandler = async (ing: Ingredient) => { await addIngredient(ing.id as string); };

  const refreshTotals = async () => { /* handled in store */ };

  const removeItemHandler = async (itemId: string) => { await removeItem(itemId); };

  const updateItemQtyHandler = async (item: BowlItem, newQty: number) => { await updateItemQty(item.id, newQty); };

  const nextStepHandler = async () => { await nextStep(); };
  const prevStepHandler = async () => { await prevStep(); };

  const confirmOrder = async () => {
    if (!orderId) return;
    const res = (await (paymentService as any)?.confirm?.(orderId)) || ({ success: true } as any);
    if (res.success) {
      toast.success('Đã xác nhận đơn');
      // totals do store đảm nhiệm
    }
    else toast.error(res.message || 'Xác nhận thất bại');
  };

  const pay = async () => {
    if (!orderId) return;
    if (!orderTotal) { toast.error('Tổng tiền chưa sẵn sàng'); return; }
    try {
      const amountPrimary = Math.round(orderTotal);
      // ZaloPay direct flow: create ZP order then redirect
      if (paymentMethod === PaymentMethod.ZALOPAY) {
        const zp = await zaloPayService.createOrder({
          orderId,
          amount: amountPrimary,
          description: `Thanh toan don ${orderId}`,
        });
        if (zp.success && zp.data?.orderUrl) {
          // Optionally record pending transaction via paymentService if needed by BE
          try { await paymentService.create({ method: 'ZALOPAY', status: 'PENDING', amount: amountPrimary, providerTxnId: zp.data.appTransId, orderId }); } catch {}
          window.location.href = zp.data.orderUrl;
          return;
        }
        const msg = encodeURIComponent(zp.message || 'Không lấy được link ZaloPay');
        window.location.href = `/payment/result?status=fail&orderId=${orderId}&message=${msg}`;
        return;
      }

      let pr = await paymentService.processPayment(orderId, paymentMethod, amountPrimary);
      if (pr.success) {
        if (paymentMethod === PaymentMethod.CASH) {
          toast.success('Bạn đã chọn thanh toán tiền mặt. Vui lòng thanh toán tại quầy hoặc khi nhận hàng.');
          router.push(`/payment/result?status=success&orderId=${orderId}`);
          return;
        }
        const url = (pr as any).data?.paymentUrl;
        if (url) {
          window.location.href = url; 
        } else {
          // Nếu là các phương thức online nhưng không có url, vẫn sang result success kèm orderId
          router.push(`/payment/result?status=success&orderId=${orderId}`);
        }
      } else {
        // If server error and we used decimal, retry with cents (or vice versa)
        const isServerError = (pr as any)?.code >= 500 || (pr as any)?.message?.toLowerCase?.().includes('internal');
        if (isServerError) {
          pr = await paymentService.processPayment(orderId, paymentMethod, amountPrimary);
          if (pr.success && paymentMethod === PaymentMethod.CASH) {
            toast.success('Bạn đã chọn thanh toán tiền mặt. Vui lòng thanh toán tại quầy hoặc khi nhận hàng.');
            router.push(`/payment/result?status=success&orderId=${orderId}`);
            return;
          }
          if (pr.success) {
            const url = (pr as any).data?.paymentUrl;
            if (url) {
              window.location.href = url;
              return;
            } else {
              router.push(`/payment/result?status=success&orderId=${orderId}`);
              return;
            }
          }
        }
        toast.error(pr.message || 'Không thể tạo thanh toán');
        router.push(`/payment/result?status=fail&orderId=${orderId}`);
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
      router.push(`/payment/result?status=fail&orderId=${orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Header totalPrice={orderTotal} totalCalories={0} showPriceInfo={true} />
      <div className="max-w-screen-2xl w-full mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Order</h1>
        </div>

        {/* Top layout: Left (Store + Template), Right (Summary/Payment) */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 xl:col-span-3">
        {/* Store Selector */}
            <div className="mb-8 sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto space-y-6 p-2">
              <div className="px-3 py-2 text-base font-semibold text-gray-800 sticky top-0 bg-gradient-to-b from-green-50/80 to-transparent backdrop-blur z-10">Chọn cửa hàng</div>
          {pageLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_,i)=>(<div key={i} className="h-20 bg-white/60 rounded-xl border border-gray-200 animate-pulse" />))}
            </div>
              ) : stores && stores.length ? (
                <div className="grid grid-cols-1 gap-3">
              {stores.map((s) => (
                <button
                  key={s.id}
                      onClick={() => { setStore(s.id); if (typeof window !== 'undefined') localStorage.setItem('storeId', s.id); }}
                  aria-pressed={selectedStoreId===s.id}
                      className={`group text-left p-4 rounded-xl border transition-all duration-200 bg-white/90 hover:shadow-md ${
                        selectedStoreId===s.id ? 'border-green-500 ring-2 ring-green-200 bg-emerald-50/60' : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                        <span className="text-2xl">🏬</span>
                    <div className="min-w-0">
                          <div className="font-semibold truncate text-sm">{s.name}</div>
                          <div className="text-xs text-gray-600 truncate">{(s as any).address || (s as any).description || 'Mở cửa hôm nay'}</div>
                    </div>
                    {selectedStoreId===s.id && (
                          <span className="ml-auto text-xs bg-green-600/90 text-white px-2 py-1 rounded-full shadow-sm">Đang chọn</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Đang tải danh sách cửa hàng...</div>
          )}
        </div>

        {/* Templates */}
            <div className="mb-0">
              <div className="px-3 py-2 text-base font-semibold text-gray-800">Chọn Template</div>
          {pageLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_,i)=>(<div key={i} className="h-28 bg-white/60 rounded-xl border border-gray-200 animate-pulse" />))}
            </div>
          ) : (
                <div className="grid grid-cols-1 gap-3">
              {templates.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTemplate(t)}
                  aria-pressed={selectedTemplate?.id===t.id}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 bg-white/90 hover:shadow-md ${
                        selectedTemplate?.id===t.id ? 'border-green-500 ring-2 ring-green-200 bg-emerald-50/60' : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                        <span className="text-2xl">🥗</span>
                    <div className="min-w-0">
                          <div className="font-semibold truncate text-sm">{t.name}</div>
                          <div className="text-xs text-gray-600 line-clamp-2">{t.description}</div>
                    </div>
                    {i===0 && selectedTemplate?.id!==t.id && (
                      <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Gợi ý</span>
                    )}
                    {selectedTemplate?.id===t.id && (
                      <span className="ml-auto text-xs bg-green-600 text-white px-2 py-1 rounded-full">Đang chọn</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={startFlow}
              disabled={!selectedTemplate}
              className={`px-5 py-2 rounded text-white shadow ${selectedTemplate ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Bắt đầu
            </button>
          </div>
        </div>
          </div>

          {/* Center: Steps + items frame */}
          <div className="lg:col-span-6 xl:col-span-6">
            {/* Always show step bar */}
            <ProgressBar
              steps={(templateSteps && templateSteps.length)
                ? templateSteps.map(s=>categories.find(c=>c.id===s.categoryId)?.name || `Step ${s.displayOrder}`)
                : ['Chọn template để xem các bước']}
              currentStep={Math.max(1, currentStepIndex + 1)}
            />

            {/* If chưa bắt đầu, hiển thị trạng thái trống */}
            {/* {currentStepIndex < 0 && (
              <div className="p-6 border rounded bg-white/70 backdrop-blur text-sm text-gray-600">
                Hãy chọn Template ở cột trái và bấm "Bắt đầu" để vào bước đầu tiên.
              </div>
            )} */}

        {currentStepIndex >= 0 && (
              <div>
              <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                <div>Bước {currentStepIndex+1}/{templateSteps.length}</div>
                <div>Order: {orderId.slice(0,8)} • Bowl: {bowlId.slice(0,8)}</div>
              </div>
              <div className="p-4 border rounded mb-4 bg-white/70 backdrop-blur">
                {(() => {
                  const step = templateSteps[currentStepIndex];
                  const cat = categories.find(c=>c.id===step?.categoryId)?.name || '';
                  const stepId = step?.id || '';
                  const count = stepId ? (stepSelections[stepId]||[]).length : 0;
                  const minItems = step?.minItems ?? 0;
                  const maxItems = step?.maxItems ?? 0;
                  const displayOrder = step?.displayOrder ?? (currentStepIndex + 1);
                  return (
                    <>
                      <div className="font-semibold">Step {displayOrder}: {cat}</div>
                      <div className="text-sm text-gray-600">Chọn {minItems}-{maxItems} • Đã chọn: {count}</div>
                    </>
                  );
                })()}
              </div>
                <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-2 rounded-lg border bg-white/70 backdrop-blur-sm">
              {stepLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
                  {[...Array(4)].map((_,i)=>(<div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />))}
                </div>
              ) : (
                <FoodSelection
                  category={categories.find(c=>c.id===templateSteps[currentStepIndex]?.categoryId)?.name || 'Ingredients'}
                  items={stepIngredients.map(i=>({
                        id: i.id as string,
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
                  selectedIds={(stepSelections[templateSteps[currentStepIndex]?.id || ''] || [])}
                  onItemSelect={(_, item)=>{
                    const ing = stepIngredients.find(ii=>ii.id===item.id);
                        if (ing) addIngredientHandler(ing);
                  }}
                  onSkip={nextStep}
                />
              )}
                </div>
              {(() => {
                const step = templateSteps[currentStepIndex];
                const picked = (stepSelections[step?.id || ''] || []).length;
                const minItems = step?.minItems ?? 0;
                const canProceed = picked >= minItems;
                const missing = Math.max(0, (minItems || 0) - picked);
                return (
                  <div className="flex items-center justify-between mt-6">
                    <button onClick={prevStep} className="px-4 py-2 border rounded hover:bg-white">Quay lại</button>
                    <div className="text-right text-gray-700 font-medium">Tạm tính bowl: {formatVND(bowlLinePrice)}</div>
                    <button
                      onClick={nextStep}
                      disabled={!canProceed}
                      className={`px-4 py-2 rounded text-white ${canProceed ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}
                      title={!canProceed && missing ? `Cần chọn thêm ${missing} mục` : ''}
                    >
                      {canProceed ? 'Tiếp tục' : `Chọn thêm ${missing}`}
                    </button>
                  </div>
                );
              })()}
              </div>
            )}
            </div>

          {/* Right: Summary/Payment sticky column (visible even before steps) */}
          <div className="lg:col-span-3 xl:col-span-3">
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
                      <input type="number" min={0} value={it.quantity} onChange={(e)=>updateItemQtyHandler(it, Math.max(0, Number(e.target.value)||0))} className="w-20 px-2 py-1 border rounded" />
                        </div>
                    <button onClick={()=>removeItemHandler(it.id)} className="px-3 py-1 text-red-600 border border-red-200 rounded text-sm">Xóa</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Chưa có nguyên liệu nào</div>
                  )}
                </div>
                <div className="p-4 border rounded bg-white/80 backdrop-blur">
                  <div className="mb-2 font-semibold">Tổng tiền</div>
                  <div className="text-2xl font-bold text-green-700 mb-4">{formatVND(orderTotal)}</div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                  <select
                    value={paymentMethod}
                    onChange={(e)=>setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value={PaymentMethod.ZALOPAY}>ZaloPay (ZALOPAY)</option>
                    <option value={PaymentMethod.CASH}>Tiền mặt (CASH)</option>
                  </select>
                </div>
                  <div className="flex gap-3">
                  <button onClick={confirmOrder} disabled={!orderId} className={`flex-1 px-4 py-2 rounded text-white ${orderId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300'}`}>Xác nhận</button>
                  <button onClick={pay} disabled={!orderId} className={`flex-1 px-4 py-2 border rounded ${orderId ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50' : 'border-gray-300 text-gray-400'}`}>Thanh toán</button>
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

        {/* Removed duplicate bottom stepper to avoid repeated template/steps rendering */}
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>}>
      <OrderPageContent />
    </Suspense>
  );
}