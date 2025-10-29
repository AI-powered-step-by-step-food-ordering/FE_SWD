// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  error?: string;
  errorCode?: string;
}

// User Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  goalCode: string;
  role: string;
  status: string;
}

export interface UserRequest {
  fullName: string;
  email: string;
  password?: string;
  goalCode: string;
  role: string;
  status: string;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  storeId: string;
  status: string;
  subtotalAmount: number;
  promotionTotal: number;
  totalAmount: number;
}

export interface OrderRequest {
  userId: string;
  storeId: string;
  status: string;
  subtotalAmount: number;
  promotionTotal: number;
  totalAmount: number;
}

// Ingredient Types
export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  categoryId: string;
}

export interface IngredientRequest {
  name: string;
  unit: string;
  unitPrice: number;
  categoryId: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  kind: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CategoryRequest {
  name: string;
  kind: string;
  displayOrder: number;
  isActive: boolean;
}

// Promotion Types
export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount?: number;
}

export interface PromotionRequest {
  code: string;
  name: string;
  description: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
}

// Store Types
export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  openingHours?: string;
}

export interface StoreRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  openingHours?: string;
}
