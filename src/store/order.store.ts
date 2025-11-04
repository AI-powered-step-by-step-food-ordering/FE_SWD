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
    
    // Try to get ingredient from cached stepIngredients first
    let ingredient: Ingredient | undefined = stepIngredients.find(ing => ing.id === ingredientId);
    let unitPrice = ingredient?.unitPrice || 0;
    
    // If not found in cache, try API call with error handling
    if (!ingredient) {
      try {
        const ingRes = await ingredientService.getById(ingredientId);
        if (ingRes?.success && ingRes?.data) {
          // Map the API response to match our Ingredient type
          const apiIngredient = ingRes.data;
          unitPrice = apiIngredient.unitPrice || 0;
        }
      } catch (error) {
        // If API call fails, log but continue with default price
        console.warn(`Failed to fetch ingredient ${ingredientId} from API, using default price:`, error);
        unitPrice = 0;
      }
    }
    
    const qty = typeof step.defaultQty === 'number' && step.defaultQty > 0 ? step.defaultQty : 1;
    await bowlService.createItem({ bowlId, ingredientId, quantity: qty, unitPrice });
    const picked = stepSelections[step.id] || [];
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
    if (!item) return;
    // sanitize and avoid no-op updates
    const nextQty = Math.max(0, Math.round(Number(qty) || 0));
    if (nextQty === item.quantity) return;
    try {
      await bowlService.updateItem(itemId, {
        quantity: nextQty,
        bowlId: item.bowlId,
        ingredientId: item.ingredientId,
        unitPrice: item.unitPrice,
      });
    } catch (e) {
      // Swallow backend 500 - recalcTotals will refresh items anyway
      console.warn('Failed to update item quantity, will refresh on recalc:', e);
    }
    // Removed redundant getByIdWithItems call - recalcTotals will refresh items
    await get().recalcTotals();
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
        set({ orderTotal: orderResult.value.data?.totalAmount || 0 });
      }
      
      // Update bowl items and line price (bowl.linePrice is updated by backend after recalc)
      if (bowlResult.status === 'fulfilled' && bowlResult.value?.success) {
        const bowlData = bowlResult.value.data as any;
        set({ 
          bowlLinePrice: bowlData?.linePrice || 0, 
          bowlItems: bowlData?.items || [] 
        });
      }
    } catch (error) {
      console.warn('Error recalculating totals:', error);
    }
  },
}));

export type { OrderState };

