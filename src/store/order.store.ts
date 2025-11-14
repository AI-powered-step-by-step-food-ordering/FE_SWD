'use client';

import { create } from 'zustand';
import { BowlItem, BowlTemplate, Category, Ingredient, TemplateStep, Store } from '@/types/api.types';
import { bowlService, bowlTemplateService, categoryService, ingredientService, orderService, paymentService, templateStepService, storeService } from '@/services';

type StepSelections = Record<string, string[]>; // stepId -> ingredientIds

interface OrderState {
  // session
  orderId: string;
  bowlId: string;
  selectedStoreId: string;
  stores: Store[];
  selectedTemplate: BowlTemplate | null;

  // data
  templates: BowlTemplate[];
  categories: Category[];
  templateSteps: TemplateStep[];
  currentStepIndex: number; // -1 when not started

  // ingredients
  stepIngredients: Ingredient[];
  ingredientsByCategory: Map<string, Ingredient[]>; // cache
  bowlItems: BowlItem[];
  stepSelections: StepSelections;

  // totals
  orderTotal: number;
  bowlLinePrice: number;

  // ui
  loading: boolean;

  // actions
  hydrateInitial: () => Promise<void>;
  setStore: (storeId: string) => void;
  setTemplate: (tpl: BowlTemplate) => Promise<void>;
  loadStepIngredients: (step: TemplateStep) => Promise<void>;
  gotoStep: (i: number) => Promise<void>;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;
  ensureOrderAndBowl: () => Promise<void>;
  addIngredient: (ingredientId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItemQty: (itemId: string, qty: number) => Promise<void>;
  recalcTotals: () => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orderId: '',
  bowlId: '',
  selectedStoreId: '',
  stores: [],
  selectedTemplate: null,

  templates: [],
  categories: [],
  templateSteps: [],
  currentStepIndex: -1,

  stepIngredients: [],
  ingredientsByCategory: new Map<string, Ingredient[]>(),
  bowlItems: [],
  stepSelections: {},

  orderTotal: 0,
  bowlLinePrice: 0,

  loading: false,

  hydrateInitial: async () => {
    set({ loading: true });
    try {
      const [tplsRes, catsRes, storesRes] = await Promise.allSettled([
        bowlTemplateService.getAll({ page: 0, size: 200 }),
        categoryService.getAll(),
        storeService.getAll(),
      ]);

      // Templates
      if (tplsRes.status === 'fulfilled' && (tplsRes.value as any)?.data) {
        const tpls = (tplsRes.value as any).data;
        set({ templates: (tpls.content || []) as BowlTemplate[] });
      } else {
        set({ templates: [] });
      }

      // Categories
      if (catsRes.status === 'fulfilled' && (catsRes.value as any)?.data) {
        const cats = (catsRes.value as any).data;
        set({ categories: (cats.content || cats) as Category[] });
      } else {
        set({ categories: [] });
      }

      // Stores
      if (storesRes.status === 'fulfilled' && (storesRes.value as any)?.data) {
        const storesWrapped = (storesRes.value as any).data;
        const stores = (storesWrapped.content || storesWrapped) as Store[];
        set({ stores });
        const saved = typeof window !== 'undefined' ? localStorage.getItem('storeId') : '';
        const initial = saved || stores[0]?.id || '';
        if (initial) set({ selectedStoreId: initial });
      } else {
        set({ stores: [] });
      }
    } finally {
      set({ loading: false });
    }
  },

  setStore: (storeId: string) => {
    // Switching store should also reset current order/bowl and selections
    set({
      selectedStoreId: storeId,
      orderId: '',
      bowlId: '',
      bowlItems: [],
      stepSelections: {},
      ingredientsByCategory: new Map<string, Ingredient[]>(),
      stepIngredients: [],
      orderTotal: 0,
      bowlLinePrice: 0,
      currentStepIndex: get().templateSteps.length ? 0 : -1,
    });
  },

  setTemplate: async (tpl: BowlTemplate) => {
    // Reset selections and current order/bowl when switching template
    set({
      selectedTemplate: tpl,
      orderId: '',
      bowlId: '',
      bowlItems: [],
      stepSelections: {},
      ingredientsByCategory: new Map<string, Ingredient[]>(),
      stepIngredients: [],
      orderTotal: 0,
      bowlLinePrice: 0,
    });
    // ưu tiên steps nhúng
    const embedded = (tpl as any).steps as TemplateStep[] | undefined;
    let steps: TemplateStep[] = [];
    if (embedded && embedded.length) {
      steps = [...embedded].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    } else {
      const res = await templateStepService.getByTemplateId(tpl.id);
      if (res.success) steps = [...res.data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }
    set({ templateSteps: steps, currentStepIndex: steps.length ? 0 : -1 });
    if (steps.length) await get().loadStepIngredients(steps[0]);
  },

  loadStepIngredients: async (step: TemplateStep) => {
    const cache = get().ingredientsByCategory;
    if (cache.has(step.categoryId)) {
      set({ stepIngredients: cache.get(step.categoryId) || [] });
      return;
    }
    const apiIngs = await ingredientService.getByCategory(step.categoryId);
    // Map API ingredients to match our Ingredient type (api.types)
    const ings: Ingredient[] = apiIngs.map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      unit: ing.unit || '',
      standardQuantity: ing.standardQuantity || 0,
      unitPrice: ing.unitPrice || 0,
      categoryId: ing.categoryId || '',
      imageUrl: ing.imageUrl || '',
    }));
    cache.set(step.categoryId, ings);
    set({ ingredientsByCategory: cache, stepIngredients: ings });
  },

  gotoStep: async (i: number) => {
    const steps = get().templateSteps;
    if (i < 0 || i >= steps.length) return;
    set({ currentStepIndex: i });
    await get().loadStepIngredients(steps[i]);
  },

  nextStep: async () => {
    const { currentStepIndex, templateSteps } = get();
    const next = currentStepIndex + 1;
    if (next >= templateSteps.length) return;
    await get().gotoStep(next);
  },

  prevStep: async () => {
    const { currentStepIndex } = get();
    const prev = currentStepIndex - 1;
    if (prev < 0) return;
    await get().gotoStep(prev);
  },

  ensureOrderAndBowl: async () => {
    const { orderId, bowlId, selectedStoreId, selectedTemplate } = get();
    if (orderId && bowlId) return;
    const userCookie = typeof document !== 'undefined'
      ? document.cookie.split(';').find(c => c.trim().startsWith('user='))?.split('=')[1]
      : undefined;
    const user = userCookie ? JSON.parse(decodeURIComponent(userCookie)) : null;
    const userId = user?.id;
    const storeId = selectedStoreId || (typeof window !== 'undefined' ? localStorage.getItem('storeId') || '' : '');
    if (!userId || !storeId) throw new Error('Thiếu thông tin người dùng hoặc cửa hàng');
    const pickupAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    // Create order first
    const ord = await orderService.create({ storeId, userId, pickupAt, note: '' });
    if (!ord.success) throw new Error(ord.message || 'Không thể tạo Order');
    const newOrderId = ord.data.id;
    set({ orderId: newOrderId });
    
    // Create bowl - can be parallel if backend supports, but order is required first
    const templateId = selectedTemplate?.id || '';
    const bowl = await bowlService.create({ 
      orderId: newOrderId, 
      templateId, 
      name: selectedTemplate?.name || 'Healthy Bowl', 
      instruction: '' 
    });
    if (!bowl.success) throw new Error(bowl.message || 'Không thể tạo Bowl');
    set({ bowlId: bowl.data.id });
  },

  addIngredient: async (ingredientId: string) => {
    const { templateSteps, currentStepIndex, stepIngredients } = get();
    if (currentStepIndex < 0) return;
    await get().ensureOrderAndBowl();
    const { bowlId, stepSelections } = get();
    const step = templateSteps[currentStepIndex];
    
    // 检查是否已经选择了这个食材（避免重复添加）
    const picked = stepSelections[step.id] || [];
    if (picked.includes(ingredientId)) {
      // 如果已经选择，不重复添加，但可以增加数量（通过updateItemQty）
      return;
    }
    
    // 检查是否超过最大数量限制
    const maxItems = step?.maxItems ?? 0;
    if (maxItems > 0 && picked.length >= maxItems) {
      throw new Error(`Bước này chỉ cho phép chọn tối đa ${maxItems} mục. Vui lòng bỏ bớt mục khác trước.`);
    }
    
    // Backend tự động lấy unitPrice từ Ingredient nếu không truyền hoặc truyền 0
    // Chỉ cần lấy từ cache nếu có, không cần gọi API
    const ingredient = stepIngredients.find(ing => ing.id === ingredientId);
    const unitPrice = ingredient?.unitPrice || 0; // Backend sẽ override nếu cần
    
    // defaultQty là số phần, cần chuyển thành gram: quantity = defaultQty × standardQuantity
    const defaultQty = typeof step.defaultQty === 'number' && step.defaultQty > 0 ? step.defaultQty : 1;
    const standardQuantity = ingredient?.standardQuantity && ingredient.standardQuantity > 0 
      ? ingredient.standardQuantity 
      : 100; // Default 100g nếu không có
    const quantityInGrams = defaultQty * standardQuantity; // Chuyển phần thành gram
    
    await bowlService.createItem({ bowlId, ingredientId, quantity: quantityInGrams, unitPrice });
    set({ stepSelections: { ...stepSelections, [step.id]: [...picked, ingredientId] } });
    await get().recalcTotals();
  },

  removeItem: async (itemId: string) => {
    const { bowlItems, templateSteps, stepSelections, stepIngredients, ingredientsByCategory } = get();
    const item = bowlItems.find(b => b.id === itemId);
    await bowlService.deleteItem(itemId);
    if (item?.ingredientId) {
      // Try to get ingredient from cached data first
      let catId: string | undefined;
      let ingredient = stepIngredients.find(ing => ing.id === item.ingredientId);
      
      if (ingredient) {
        catId = ingredient.categoryId;
      } else {
        // If not in current step, search in all cached ingredients
        for (const ingredients of ingredientsByCategory.values()) {
          ingredient = ingredients.find(ing => ing.id === item.ingredientId);
          if (ingredient) {
            catId = ingredient.categoryId;
            break;
          }
        }
      }
      
      // If still not found, try API call with error handling
      if (!catId) {
        try {
          const ingDetail = await ingredientService.getById(item.ingredientId);
          catId = ingDetail?.data?.categoryId;
        } catch (error) {
          console.warn(`Failed to fetch ingredient ${item.ingredientId} from API:`, error);
        }
      }
      
      if (catId) {
        const idx = templateSteps.findIndex(s => s.categoryId === catId);
        if (idx >= 0) {
          // remove selection mapping for this step
          const stepId = templateSteps[idx].id;
          const picked = stepSelections[stepId] || [];
          const nextPicked = picked.filter(id => id !== item.ingredientId);
          set({ currentStepIndex: idx, stepSelections: { ...stepSelections, [stepId]: nextPicked } });
        }
      }
    }
    // Removed redundant getByIdWithItems call - recalcTotals will refresh items
    await get().recalcTotals();
  },

  updateItemQty: async (itemId: string, qty: number) => {
    const { bowlItems } = get();
    const item = bowlItems.find(b => b.id === itemId);
    if (!item) {
      console.warn('[updateItemQty] Item not found:', itemId);
      return;
    }
    
    // 确保数量是有效的正数
    const rawQty = Number(qty) || 0;
    if (rawQty <= 0) {
      console.warn('[updateItemQty] Invalid quantity:', rawQty, 'for item:', itemId);
      return;
    }
    
    // 保留合理精度（保留2位小数），避免浮点数问题
    // 例如：100.001 → 100.00, 100.005 → 100.01
    const nextQty = Math.round(rawQty * 100) / 100;
    
    // 避免无意义的更新（如果差异小于 0.01，则不更新）
    const currentQty = item.quantity || 0;
    if (Math.abs(nextQty - currentQty) < 0.01) {
      return;
    }
    
    // 验证必需字段
    if (!item.bowlId || !item.ingredientId) {
      console.error('[updateItemQty] Missing required fields:', { bowlId: item.bowlId, ingredientId: item.ingredientId });
      return;
    }
    
    try {
      const updateData = {
        quantity: nextQty,
        bowlId: item.bowlId,
        ingredientId: item.ingredientId,
        unitPrice: item.unitPrice || 0,
      };
      
      console.log('[updateItemQty] Updating item:', itemId, 'with data:', updateData);
      await bowlService.updateItem(itemId, updateData);
      
      // 更新成功后立即重新计算总额
      await get().recalcTotals();
    } catch (e: any) {
      // 记录详细错误信息
      console.error('[updateItemQty] Failed to update item quantity:', {
        itemId,
        quantity: nextQty,
        error: e?.response?.data || e?.message || e,
        status: e?.response?.status,
      });
      // 即使失败也尝试刷新数据
      await get().recalcTotals();
    }
  },

  recalcTotals: async () => {
    const { orderId, bowlId } = get();
    if (!orderId) return;
    
    // Optimized: recalc first, then get updated data in parallel
    try {
      // Step 1: Recalculate order totals (backend updates both order and bowl)
      const recalcResult = await orderService.recalculate(orderId);
      
      // Step 2: Get updated data in parallel (bowl includes linePrice, order includes totalAmount)
      const [orderResult, bowlResult] = await Promise.allSettled([
        orderService.getById(orderId),
        bowlId ? bowlService.getByIdWithItems(bowlId) : Promise.resolve(null),
      ]);
      
      // Update order total
      if (orderResult.status === 'fulfilled' && orderResult.value?.success) {
        const totalAmount = orderResult.value.data?.totalAmount;
        console.log('[recalcTotals] Order totalAmount from backend:', totalAmount);
        set({ orderTotal: totalAmount || 0 });
      }
      
      // Update bowl items and line price (bowl.linePrice is updated by backend after recalc)
      if (bowlResult.status === 'fulfilled' && bowlResult.value?.success) {
        const bowlData = bowlResult.value.data as any;
        const linePrice = bowlData?.linePrice;
        console.log('[recalcTotals] Bowl linePrice from backend:', linePrice);
        console.log('[recalcTotals] Bowl items:', bowlData?.items);
        set({ 
          bowlLinePrice: linePrice || 0, 
          bowlItems: bowlData?.items || [] 
        });
      }
    } catch (error) {
      console.warn('Error recalculating totals:', error);
    }
  },
}));

export type { OrderState };

