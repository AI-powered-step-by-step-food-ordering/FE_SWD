'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
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
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getFirebaseThumbnail } from '@/lib/firebase-storage';

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
    addIngredient, removeItem, updateItemQty, recalcTotals
  } = useOrderStore();
  
  // 获取所有已缓存的ingredients（用于显示所有步骤的食材）
  const getAllCachedIngredients = (): Ingredient[] => {
    const store = useOrderStore.getState();
    const allIngredients: Ingredient[] = [];
    // 从当前步骤的ingredients开始
    allIngredients.push(...stepIngredients);
    // 从store中获取所有已缓存的ingredients
    store.ingredientsByCategory.forEach((ings) => {
      ings.forEach(ing => {
        if (!allIngredients.find(i => i.id === ing.id)) {
          allIngredients.push(ing);
        }
      });
    });
    return allIngredients;
  };
  const pageLoading = loading;
  const stepLoading = false;
  const selectedTemplate: BowlTemplate | null = useOrderStore(s => s.selectedTemplate);
  const selectedStoreId: string = useOrderStore(s => s.selectedStoreId);
  const stores: Store[] = useOrderStore(s => s.stores as any);
  // Toggle to send amount in cents if backend requires integer amounts
  const USE_CENTS_FOR_PAYMENT = false;
  // Payment method selection (must match BE enum)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ZALOPAY);
  // Track item refs for auto-scroll
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

  useEffect(() => {
    hydrateInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // CHỈ chạy 1 lần khi mount, không phụ thuộc biến init nữa

  // Auto-scroll to newly added item
  useEffect(() => {
    if (lastAddedItemId && itemRefs.current[lastAddedItemId]) {
      const element = itemRefs.current[lastAddedItemId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Highlight briefly
        element.classList.add('ring-2', 'ring-emerald-400', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-emerald-400', 'ring-offset-2');
        }, 1000);
        setLastAddedItemId(null); // Reset
      }
    }
  }, [lastAddedItemId]);

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

  const addIngredientHandler = async (ing: Ingredient) => { 
    try {
      await addIngredient(ing.id as string);
      // Sau khi thêm thành công, tìm itemId mới nhất để scroll đến
      setTimeout(() => {
        const currentBowlItems = useOrderStore.getState().bowlItems;
        const newItem = currentBowlItems.find(item => item.ingredientId === ing.id);
        if (newItem) {
          setLastAddedItemId(newItem.id);
        }
      }, 100); // Delay nhỏ để đảm bảo DOM đã render
    } catch (error: any) {
      toast.error(error?.message || 'Không thể thêm nguyên liệu');
    }
  };

  const refreshTotals = async () => { /* handled in store */ };

  const removeItemHandler = async (itemId: string) => { 
    await removeItem(itemId); 
  };

  // 直接调用 API 更新数量
  const updateItemQtyHandler = async (item: BowlItem, newQty: number) => {
    if (newQty <= 0) {
      console.warn('[updateItemQtyHandler] Invalid quantity:', newQty);
      return;
    }
    
    try {
      await updateItemQty(item.id, newQty);
    } catch (error) {
      console.error('[updateItemQtyHandler] Failed to update quantity:', error);
    }
  };

  const nextStepHandler = async () => { 
    await nextStep(); 
  };
  const prevStepHandler = async () => { 
    await prevStep(); 
  };

  const confirmOrder = async () => {
    if (!orderId) return;
    try {
      // 重新计算金额以确保准确
      await recalcTotals();
      const res = (await (paymentService as any)?.confirm?.(orderId)) || ({ success: true } as any);
      if (res.success) {
        toast.success('Đã xác nhận đơn');
        // 确认后再次刷新金额
        await recalcTotals();
      }
      else toast.error(res.message || 'Xác nhận thất bại');
    } catch (error: any) {
      toast.error('Lỗi khi xác nhận đơn: ' + (error?.message || 'Unknown error'));
    }
  };

  const pay = async () => {
    if (!orderId) return;
    try {
      // 支付前重新计算金额以确保准确
      await recalcTotals();
      // 等待一下让状态更新
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 获取最新的金额
      const latestOrder = useOrderStore.getState();
      const currentTotal = latestOrder.orderTotal;
      
      if (!currentTotal || currentTotal <= 0) { 
        toast.error('Tổng tiền chưa sẵn sàng hoặc bằng 0'); 
        return; 
      }
      
      const amountPrimary = Math.round(currentTotal);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Header totalPrice={orderTotal} totalCalories={0} showPriceInfo={true} />
      <div className="max-w-screen-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* 页面标题 - 改进设计 */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Tạo Bowl Của Bạn
          </h1>
          <p className="text-gray-600 text-lg">Chọn cửa hàng, template và tùy chỉnh món ăn theo sở thích</p>
        </div>

        {/* Top layout: Left (Store + Template), Right (Summary/Payment) */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 xl:col-span-3">
        {/* Store Selector - 改进设计 */}
            <div className="mb-8 space-y-6">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-5 shadow-lg mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <i className="bx bx-store text-white text-2xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Chọn cửa hàng</h2>
                    <p className="text-sm text-emerald-100">Chọn địa điểm nhận hàng</p>
                  </div>
                </div>
              </div>
          {pageLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_,i)=>(<div key={i} className="h-20 bg-white/60 rounded-xl border border-gray-200 animate-pulse" />))}
            </div>
              ) : stores && stores.length ? (
                <div className="grid grid-cols-1 gap-4">
              {stores.map((s) => (
                <button
                  key={s.id}
                      onClick={() => { setStore(s.id); if (typeof window !== 'undefined') localStorage.setItem('storeId', s.id); }}
                  aria-pressed={selectedStoreId===s.id}
                      className={`group relative text-left p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                        selectedStoreId===s.id 
                          ? 'border-emerald-500 ring-4 ring-emerald-200/50 bg-gradient-to-br from-emerald-50 to-green-50 shadow-xl scale-[1.02]' 
                          : 'border-gray-200 hover:border-emerald-300 bg-white hover:shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  {/* 选中状态的装饰背景 */}
                  {selectedStoreId===s.id && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-green-400/5 to-teal-400/10"></div>
                  )}
                  
                  <div className="relative flex items-center gap-4">
                        {s.imageUrl ? (
                          <div className="relative flex-shrink-0">
                            <div className={`absolute -inset-1 rounded-xl blur-md transition-all ${
                              selectedStoreId===s.id ? 'bg-emerald-400/30' : 'bg-gray-200/0 group-hover:bg-emerald-200/20'
                            }`}></div>
                            <ImageWithFallback
                              src={getFirebaseThumbnail(s.imageUrl)}
                              alt={s.name || "Store"}
                              width={56}
                              height={56}
                              className="relative rounded-xl object-cover ring-2 ring-white shadow-md"
                              fallbackSrc="/icon.svg"
                            />
                          </div>
                        ) : (
                          <div className={`flex h-14 w-14 items-center justify-center rounded-xl flex-shrink-0 transition-all ${
                            selectedStoreId===s.id 
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                          }`}>
                            <i className="bx bx-store text-2xl"></i>
                          </div>
                        )}
                    <div className="min-w-0 flex-1">
                          <div className={`font-bold truncate text-base mb-1 ${
                            selectedStoreId===s.id ? 'text-emerald-700' : 'text-gray-900'
                          }`}>{s.name}</div>
                          <div className={`text-xs truncate flex items-center gap-1 ${
                            selectedStoreId===s.id ? 'text-emerald-600' : 'text-gray-500'
                          }`}>
                            <i className="bx bx-map text-sm"></i>
                            {(s as any).address || (s as any).description || 'Mở cửa hôm nay'}
                          </div>
                    </div>
                    {selectedStoreId===s.id && (
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1.5 rounded-full shadow-md">
                              <i className="bx bx-check-circle text-sm"></i>
                              Đang chọn
                            </span>
                          </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Đang tải danh sách cửa hàng...</div>
          )}
        </div>

        {/* Templates - 改进设计 */}
            <div className="mb-0">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-5 shadow-lg mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <i className="bx bx-bowl-rice text-white text-2xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Chọn Template</h2>
                    <p className="text-sm text-teal-100">Chọn loại bowl yêu thích</p>
                  </div>
                </div>
              </div>
          {pageLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_,i)=>(<div key={i} className="h-28 bg-white/60 rounded-xl border border-gray-200 animate-pulse" />))}
            </div>
          ) : (
                <div className="grid grid-cols-1 gap-4">
              {templates.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTemplate(t)}
                  aria-pressed={selectedTemplate?.id===t.id}
                      className={`group relative text-left p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                        selectedTemplate?.id===t.id 
                          ? 'border-teal-500 ring-4 ring-teal-200/50 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-xl scale-[1.02]' 
                          : 'border-gray-200 hover:border-teal-300 bg-white hover:shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  {/* 选中状态的装饰背景 */}
                  {selectedTemplate?.id===t.id && (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 via-cyan-400/5 to-blue-400/10"></div>
                  )}
                  
                  <div className="relative flex items-start gap-4">
                        {t.imageUrl ? (
                          <div className="relative flex-shrink-0">
                            <div className={`absolute -inset-1 rounded-xl blur-md transition-all ${
                              selectedTemplate?.id===t.id ? 'bg-teal-400/30' : 'bg-gray-200/0 group-hover:bg-teal-200/20'
                            }`}></div>
                            <ImageWithFallback
                              src={getFirebaseThumbnail(t.imageUrl)}
                              alt={t.name || "Template"}
                              width={72}
                              height={72}
                              className="relative rounded-xl object-cover ring-2 ring-white shadow-md"
                              fallbackSrc="/icon.svg"
                            />
                          </div>
                        ) : (
                          <div className={`flex h-18 w-18 items-center justify-center rounded-xl flex-shrink-0 transition-all ${
                            selectedTemplate?.id===t.id 
                              ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-400 group-hover:bg-teal-100 group-hover:text-teal-600'
                          }`}>
                            <i className="bx bx-bowl-rice text-3xl"></i>
                          </div>
                        )}
                    <div className="min-w-0 flex-1 pt-1">
                          <div className={`font-bold truncate text-base mb-1.5 ${
                            selectedTemplate?.id===t.id ? 'text-teal-700' : 'text-gray-900'
                          }`}>{t.name}</div>
                          <div className={`text-xs line-clamp-2 leading-relaxed ${
                            selectedTemplate?.id===t.id ? 'text-teal-600' : 'text-gray-500'
                          }`}>{t.description}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {i===0 && selectedTemplate?.id!==t.id && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2.5 py-1 rounded-full shadow-sm">
                          <i className="bx bx-star text-xs"></i>
                          Gợi ý
                        </span>
                      )}
                      {selectedTemplate?.id===t.id && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-3 py-1.5 rounded-full shadow-md">
                          <i className="bx bx-check-circle text-sm"></i>
                          Đang chọn
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="mt-6">
            <button
              onClick={startFlow}
              disabled={!selectedTemplate}
              className={`group relative w-full px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all duration-300 overflow-hidden ${
                selectedTemplate 
                  ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 hover:from-teal-700 hover:via-cyan-700 hover:to-teal-700 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {selectedTemplate && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              <span className="relative flex items-center justify-center gap-2">
                <i className="bx bx-play-circle text-xl"></i>
                Bắt đầu tạo bowl
              </span>
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
              <div className="flex items-center justify-end mb-6 px-2">
                <div className="text-sm text-gray-500 hidden sm:flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded-lg font-mono text-xs">#{orderId.slice(0,8)}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-lg font-mono text-xs">#{bowlId.slice(0,8)}</span>
                </div>
              </div>
              <div className="p-6 border-2 border-emerald-200 rounded-2xl mb-6 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur shadow-lg">
                {(() => {
                  const step = templateSteps[currentStepIndex];
                  const cat = categories.find(c=>c.id===step?.categoryId)?.name || '';
                  const stepId = step?.id || '';
                  const count = stepId ? (stepSelections[stepId]||[]).length : 0;
                  const minItems = step?.minItems ?? 0;
                  const maxItems = step?.maxItems ?? 0;
                  const displayOrder = step?.displayOrder ?? (currentStepIndex + 1);
                  const isValid = count >= minItems && (maxItems === 0 || count <= maxItems);
                  const requirementText = maxItems > 0 
                    ? `Chọn ${minItems}-${maxItems} mục` 
                    : `Chọn tối thiểu ${minItems} mục`;
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {displayOrder}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl text-gray-900 mb-2">{cat}</div>
                          <div className={`text-sm flex items-center gap-2 flex-wrap ${isValid ? 'text-emerald-600' : 'text-orange-600 font-medium'}`}>
                            <i className={`bx ${isValid ? 'bx-check-circle text-base' : 'bx-error-circle text-base'}`}></i>
                            <span className="font-semibold">{requirementText}</span>
                            <span className={`px-3 py-1 rounded-lg font-semibold ${
                              isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              Đã chọn: {count}
                            </span>
                            {maxItems > 0 && count > maxItems && (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-semibold">
                                Quá {count - maxItems} mục
                              </span>
                            )}
                            {count < minItems && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg font-semibold">
                                Thiếu {minItems - count} mục
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
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
                />
              )}
                </div>
              {(() => {
                const step = templateSteps[currentStepIndex];
                const stepId = step?.id || '';
                const picked = (stepSelections[stepId] || []).length;
                const minItems = step?.minItems ?? 0;
                const maxItems = step?.maxItems ?? 0;
                // Kiểm tra xem đã chọn đủ món chưa
                const canProceed = picked >= minItems && (maxItems === 0 || picked <= maxItems);
                // Kiểm tra xem đã hết step chưa
                const isLastStep = currentStepIndex >= templateSteps.length - 1;
                // Chỉ disable khi đã hết step (không disable khi đã chọn đủ món)
                const shouldDisableContinue = isLastStep;
                const missing = Math.max(0, minItems - picked);
                const exceeded = maxItems > 0 && picked > maxItems ? picked - maxItems : 0;
                return (
                  <div className="flex items-center justify-between mt-8 gap-4">
                    <button 
                      onClick={prevStepHandler}
                      disabled={currentStepIndex === 0}
                      className={`group px-6 py-3 border-2 rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 ${
                        currentStepIndex === 0
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700'
                      }`}
                    >
                      <i className="bx bx-chevron-left text-xl"></i>
                      Quay lại
                    </button>
                    <div className="flex-1 text-center px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
                      <div className="text-xs text-gray-600 mb-1">Tạm tính bowl</div>
                      <div className="text-lg font-bold text-emerald-700">{formatVND(bowlLinePrice)}</div>
                    </div>
                    <button
                      onClick={nextStepHandler}
                      disabled={!canProceed || shouldDisableContinue}
                      className={`group px-6 py-3 rounded-xl font-bold text-white transition-all duration-200 flex items-center gap-2 ${
                        canProceed && !shouldDisableContinue
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={
                        shouldDisableContinue
                          ? 'Đã hoàn thành tất cả các bước'
                          : !canProceed
                          ? exceeded > 0 
                            ? `Đã chọn quá ${exceeded} mục. Tối đa ${maxItems} mục.` 
                            : `Cần chọn thêm ${missing} mục (tối thiểu ${minItems}${maxItems > 0 ? `, tối đa ${maxItems}` : ''} mục)`
                          : ''
                      }
                    >
                      {shouldDisableContinue ? (
                        <>
                          <i className="bx bx-check-circle text-xl"></i>
                          Hoàn thành
                        </>
                      ) : !canProceed ? (
                        exceeded > 0 ? (
                          <>
                            <i className="bx bx-minus-circle text-xl"></i>
                            Bỏ bớt {exceeded}
                          </>
                        ) : (
                          <>
                            <i className="bx bx-plus-circle text-xl"></i>
                            Chọn thêm {missing}
                          </>
                        )
                      ) : (
                        <>
                          Tiếp tục
                          <i className="bx bx-chevron-right text-xl"></i>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}
              </div>
            )}
            </div>

          {/* Right: Summary/Payment sticky column (visible even before steps) */}
          <div className="lg:col-span-3 xl:col-span-3">
              <div className="lg:sticky lg:top-24 space-y-4 max-h-[calc(100vh-140px)] lg:overflow-y-auto">
                <div className="p-6 border-0 rounded-3xl bg-white/95 backdrop-blur-sm shadow-xl shadow-green-100/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-green-400 via-emerald-500 to-green-600 rounded-full shadow-sm"></div>
                    <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">Đã chọn</h3>
                  </div>
                  {(() => {
                    const allIngredients = getAllCachedIngredients();
                    
                    return bowlItems.length ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {bowlItems.map((it, index) => {
                          const ingredient = allIngredients.find(i => i.id === it.ingredientId);
                     
                          // Backend đã tính sẵn unitPrice (snapshot) trong BowlItem
                          const unitPrice = it.unitPrice ?? ingredient?.unitPrice ?? 0;
          
                          const standardQuantity = (ingredient?.standardQuantity && ingredient.standardQuantity > 0) 
                            ? ingredient.standardQuantity 
                            : 1;
                    
                          // Sử dụng số lượng thực tế từ backend (theo gram)
                          let itemQuantity = it.quantity || 0;
                          
                          // Xử lý dữ liệu cũ: nếu quantity < standardQuantity, có thể là số phần
                          // Cần chuyển thành gram: quantity = portions × standardQuantity
                          if (itemQuantity > 0 && itemQuantity < standardQuantity && standardQuantity > 1) {
                            // Có thể là số phần, chuyển thành gram
                            itemQuantity = itemQuantity * standardQuantity;
                          }

                          // Tính giá mỗi đơn vị (để hiển thị): unitPrice là giá cho standardQuantity
                          // Ví dụ: unitPrice=5000, standardQuantity=100g → giá mỗi gram = 5000/100 = 50 đ/g
                          const pricePerUnit = standardQuantity > 0 && standardQuantity !== 1
                            ? unitPrice / standardQuantity
                            : unitPrice;
                          
                          // Tính thành tiền: theo công thức backend (quantity / standardQuantity) × unitPrice
                          // Backend đã tính sẵn trong bowl.linePrice, nhưng cần tính từng item để hiển thị
                          const itemSubtotal = standardQuantity > 0 && standardQuantity !== 1
                            ? Math.round((itemQuantity / standardQuantity) * unitPrice)
                            : Math.round(itemQuantity * unitPrice);
                          
                          // 调试日志：检查价格计算（仅在开发环境）
                          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                            console.log('[BowlItem]', {
                              ingredientName: ingredient?.name,
                              quantity: itemQuantity,
                              standardQuantity,
                              unitPrice,
                              pricePerUnit,
                              calculatedSubtotal: itemSubtotal,
                              bowlItemUnitPrice: it.unitPrice,
                              ingredientUnitPrice: ingredient?.unitPrice
                            });
                          }
                          return (
                            <div 
                              key={it.id} 
                              ref={(el) => { itemRefs.current[it.id] = el; }}
                              className="group relative overflow-hidden bg-gradient-to-br from-white via-gray-50/30 to-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-2xl hover:border-emerald-300/60 transition-all duration-300 hover:-translate-y-0.5"
                            >
                              {/* 装饰性背景 */}
                              <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 via-emerald-50/0 to-green-50/0 group-hover:from-green-50/30 group-hover:via-emerald-50/20 group-hover:to-green-50/30 transition-all duration-500"></div>
                              
                              <div className="relative p-4 flex items-start gap-4">
                                {/* 食材图片 */}
                                <div className="relative flex-shrink-0">
                                  <div className="absolute -inset-0.5 bg-gradient-to-br from-green-400/0 to-emerald-500/0 group-hover:from-green-400/30 group-hover:to-emerald-500/30 rounded-2xl blur-md transition-all duration-500"></div>
                                  {ingredient?.imageUrl ? (
                                    <div className="relative">
                                      <ImageWithFallback
                                        src={getFirebaseThumbnail(ingredient.imageUrl)}
                                        alt={ingredient.name || "Ingredient"}
                                        width={88}
                                        height={88}
                                        className="relative rounded-2xl object-cover shadow-lg ring-2 ring-white/80 group-hover:ring-4 group-hover:ring-emerald-200/50 transition-all duration-300"
                                        fallbackSrc="/icon.svg"
                                      />
                                    </div>
                                  ) : (
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 via-gray-50 to-white shadow-lg ring-2 ring-white/80">
                                      <i className="bx bx-food-menu text-gray-400 text-4xl"></i>
                                    </div>
                                  )}
                                </div>
                                
                                {/* 食材信息区域 */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                  {/* 名称和删除按钮行 */}
                                  <div className="flex items-start justify-between mb-2.5">
                                    <h4 className="font-bold text-gray-900 text-base leading-snug pr-2 flex-1" title={ingredient?.name || it.ingredientId}>
                                      {ingredient?.name || it.ingredientId}
                                    </h4>
                                    <button 
                                      onClick={() => removeItemHandler(it.id)} 
                                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-red-400/80 hover:text-white hover:bg-gradient-to-br hover:from-red-500 hover:via-red-500 hover:to-red-600 border border-red-200/60 hover:border-transparent rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-110 active:scale-95 ml-2"
                                      title="Xóa món này"
                                    >
                                      <i className="bx bx-trash text-sm"></i>
                                    </button>
                                  </div>
                                  
                                  {/* 价格信息卡片 */}
                                  <div className="mb-3 p-2.5 bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-emerald-50/80 rounded-xl border border-emerald-100/60 shadow-inner">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Đơn giá</span>
                                      <span className="text-xs font-bold text-gray-700">
                                        {formatVND(pricePerUnit)}<span className="text-[10px] font-normal text-gray-500">/{ingredient?.unit || 'g'}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-baseline justify-between pt-1 border-t border-emerald-200/50">
                                      <span className="text-xs font-semibold text-gray-600">Thành tiền</span>
                                      <span className="text-base font-extrabold text-emerald-600 tracking-tight">
                                        {formatVND(itemSubtotal)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* 数量控制 - 显示为"份数"而不是克数/毫升 */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Số lượng:</span>
                                    {(() => {
                                      // 计算份数：使用实际数量
                                      // 确保standardQuantity > 0，避免除零错误
                                      const safeStandardQty = standardQuantity > 0 ? standardQuantity : 1;
                                      const currentQty = itemQuantity || 0;
                                      // 计算份数：四舍五入到整数
                                      const portions = Math.max(1, Math.round(currentQty / safeStandardQty));
                                      const minPortions = 1;
                                      const maxPortions = 999;
                                      
                                      return (
                                        <div className="flex items-center gap-1 bg-white/90 border border-gray-300/60 rounded-lg px-1.5 py-1 shadow-inner hover:border-emerald-400/60 hover:shadow-md transition-all duration-200">
                                          <button
                                            onClick={async () => {
                                              const newPortions = Math.max(minPortions, portions - 1);
                                              // 计算精确数量：newPortions * safeStandardQty
                                              const newQty = newPortions * safeStandardQty;
                                              // 验证数量有效性
                                              if (newQty > 0 && newQty >= safeStandardQty) {
                                                await updateItemQtyHandler(it, newQty);
                                              } else {
                                                console.warn('[Quantity Control] Invalid quantity calculated:', newQty, 'for portions:', newPortions, 'standardQty:', safeStandardQty);
                                              }
                                            }}
                                            className="w-5 h-5 flex items-center justify-center text-gray-500/80 hover:text-white hover:bg-gradient-to-br hover:from-emerald-500 hover:to-green-600 rounded transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
                                            disabled={portions <= minPortions}
                                          >
                                            <i className="bx bx-minus text-xs"></i>
                                          </button>
                                          <input 
                                            type="number" 
                                            min={minPortions} 
                                            max={maxPortions}
                                            value={portions} 
                                            onChange={async (e) => {
                                              const inputValue = Number(e.target.value) || minPortions;
                                              const newPortions = Math.max(minPortions, Math.min(maxPortions, Math.round(inputValue)));
                                              // 计算精确数量：newPortions * safeStandardQty
                                              const newQty = newPortions * safeStandardQty;
                                              // 验证数量有效性
                                              if (newQty > 0 && newQty >= safeStandardQty) {
                                                await updateItemQtyHandler(it, newQty);
                                              } else {
                                                console.warn('[Quantity Control] Invalid quantity calculated:', newQty, 'for portions:', newPortions, 'standardQty:', safeStandardQty);
                                              }
                                            }} 
                                            className="w-10 px-0.5 py-0.5 text-xs text-center font-bold text-gray-800 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-emerald-400/50 rounded" 
                                          />
                                          <button
                                            onClick={async () => {
                                              const newPortions = Math.min(maxPortions, portions + 1);
                                              // 计算精确数量：newPortions * safeStandardQty
                                              const newQty = newPortions * safeStandardQty;
                                              // 验证数量有效性
                                              if (newQty > 0 && newQty >= safeStandardQty) {
                                                await updateItemQtyHandler(it, newQty);
                                              } else {
                                                console.warn('[Quantity Control] Invalid quantity calculated:', newQty, 'for portions:', newPortions, 'standardQty:', safeStandardQty);
                                              }
                                            }}
                                            className="w-5 h-5 flex items-center justify-center text-gray-500/80 hover:text-white hover:bg-gradient-to-br hover:from-emerald-500 hover:to-green-600 rounded transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
                                            disabled={portions >= maxPortions}
                                          >
                                            <i className="bx bx-plus text-xs"></i>
                                          </button>
                                        </div>
                                      );
                                    })()}
                                    <span className="text-xs font-semibold text-gray-400">phần</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* 总计卡片 */}
                        <div className="mt-5 pt-4 border-t border-dashed border-gray-300/60">
                          <div className="p-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 rounded-2xl shadow-xl shadow-emerald-500/30">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white/95 tracking-wide">Tổng bowl</span>
                              <span className="text-2xl font-extrabold text-white drop-shadow-lg tracking-tight">{formatVND(bowlLinePrice)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-14 text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-100/80 via-gray-50/60 to-white mb-4 shadow-inner">
                          <i className="bx bx-bowl-rice text-gray-400 text-5xl"></i>
                        </div>
                        <div className="text-base font-semibold text-gray-500 mb-1">Chưa có nguyên liệu nào</div>
                        <div className="text-sm text-gray-400">Hãy chọn nguyên liệu từ các bước bên trái</div>
                      </div>
                    );
                  })()}
                </div>
                <div className="p-6 border-0 rounded-3xl bg-white/95 backdrop-blur-sm shadow-xl shadow-emerald-100/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-400 via-green-500 to-emerald-600 rounded-full shadow-sm"></div>
                    <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">Thanh toán</h3>
                  </div>
                  
                  {/* 总金额卡片 */}
                  <div className="mb-6 p-5 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-2xl shadow-2xl shadow-emerald-500/40 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="relative">
                      <div className="text-xs font-semibold text-white/90 mb-1.5 uppercase tracking-wider">Tổng tiền đơn hàng</div>
                      <div className="text-3xl font-extrabold text-white drop-shadow-lg tracking-tight">{formatVND(orderTotal)}</div>
                    </div>
                  </div>
                  
                  {/* 支付方式 */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wide">Phương thức thanh toán</label>
                    <select
                      value={paymentMethod}
                      onChange={(e)=>setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-4 py-3 border-2 border-gray-200/60 rounded-xl bg-white/90 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all shadow-sm hover:border-emerald-300/60 hover:shadow-md"
                    >
                      <option value={PaymentMethod.ZALOPAY}>ZaloPay (ZALOPAY)</option>
                      <option value={PaymentMethod.CASH}>Tiền mặt (CASH)</option>
                    </select>
                  </div>
                  
                  {/* 操作按钮 */}
                  {(() => {
                    // Kiểm tra xem tất cả các step đã hoàn thành chưa
                    const allStepsCompleted = templateSteps.every(step => {
                      const stepId = step?.id || '';
                      const count = stepId ? (stepSelections[stepId] || []).length : 0;
                      const minItems = step?.minItems ?? 0;
                      const maxItems = step?.maxItems ?? 0;
                      return count >= minItems && (maxItems === 0 || count <= maxItems);
                    });
                    const canPay = orderId && allStepsCompleted;
                    
                    return (
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={pay} 
                          disabled={!canPay} 
                          className={`group relative w-full px-5 py-3.5 rounded-xl font-bold text-sm border-2 transition-all duration-200 overflow-hidden ${
                            canPay 
                              ? 'border-emerald-500/80 text-emerald-700 bg-white/90 hover:bg-gradient-to-r hover:from-emerald-50/90 hover:via-green-50/90 hover:to-emerald-50/90 hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-200/50 hover:scale-[1.02] active:scale-[0.98]' 
                              : 'border-gray-300/60 text-gray-400 bg-gray-50/90 cursor-not-allowed'
                          }`}
                          title={!canPay ? (!orderId ? 'Chưa có đơn hàng' : 'Vui lòng hoàn thành tất cả các bước trước khi thanh toán') : ''}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/0 to-green-100/0 group-hover:from-emerald-100/30 group-hover:to-green-100/30 transition-all duration-200"></div>
                          <span className="relative flex items-center justify-center">
                            <i className="bx bx-credit-card mr-2 text-lg"></i>
                            Thanh toán ngay
                          </span>
                        </button>
                      </div>
                    );
                  })()}
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