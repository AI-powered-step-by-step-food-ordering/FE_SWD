// Base API Response
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  role?: 'ADMIN' | 'USER';
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  goalCode?: string;
  dateOfBirth?: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  email: string;
  fullName: string;
  id?: string;
  goalCode?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  imageUrl?: string;
  dateOfBirth?: string; // ISO date string
  address?: string;
  phone?: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// OTP Auth Flows
export interface VerifyOtpRequest {
  email: string;
  otp: string; // 6-digit string
}

export interface ResendVerificationOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string; // 6-digit string
  newPassword: string;
  passwordConfirm: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  goalCode?: string;
  status?: string;
  imageUrl?: string;
  dateOfBirth?: string; // ISO date string
  address?: string;
  phone?: string;
  gender?: string; // MALE, FEMALE, OTHER
  createdAt?: string;
  updatedAt?: string;
}

export interface UserUpdateRequest {
  fullName?: string;
  email?: string;
  goalCode?: string;
  imageUrl?: string;
  dateOfBirth?: string; // ISO date string
  address?: string;
  phone?: string;
  gender?: string; // MALE, FEMALE, OTHER
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

// Ingredient Types
export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  categoryId: string;
  imageUrl?: string;
  description?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface IngredientRequest {
  name: string;
  unit: string;
  unitPrice: number;
  categoryId: string;
}

// Bowl Template Types
export interface BowlTemplate {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface BowlTemplateRequest {
  name: string;
  description: string;
  isActive: boolean;
}

// Template Step Types
export interface TemplateStep {
  id: string;
  templateId: string;
  categoryId: string;
  minItems: number;
  maxItems: number;
  defaultQty: number;
  displayOrder: number;
}

export interface TemplateStepRequest {
  minItems: number;
  maxItems: number;
  defaultQty: number;
  displayOrder: number;
  templateId: string;
  categoryId: string;
}

// Store Types
export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface StoreRequest {
  name: string;
  address: string;
  phone: string;
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
  pickupAt?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderRequest {
  pickupAt?: string;
  note?: string;
  storeId: string;
  userId: string;
}

// Bowl Types
export interface Bowl {
  id: string;
  orderId: string;
  templateId: string;
  name: string;
  instruction: string;
  linePrice: number;
}

export interface BowlRequest {
  name: string;
  instruction: string;
  orderId: string;
  templateId: string;
}

// Bowl Item Types
export interface BowlItem {
  id: string;
  bowlId: string;
  ingredientId: string;
  quantity: number;
  unitPrice: number;
}

export interface BowlItemRequest {
  quantity: number;
  unitPrice: number;
  bowlId: string;
  ingredientId: string;
}

// Promotion Types
export interface Promotion {
  id: string;
  code: string;
  name: string;
  type: string;
  percentOff: number;
  amountOff: number;
  minOrderValue: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
  perOrderLimit?: number;
}

export interface PromotionRequest {
  code: string;
  name: string;
  type: string;
  percentOff: number;
  amountOff: number;
  minOrderValue: number;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
  perOrderLimit?: number;
  isActive: boolean;
}

// Payment Transaction Types
export interface PaymentTransaction {
  id: string;
  orderId: string;
  method: string;
  status: string;
  amount: number;
  providerTxnId?: string;
}

export interface PaymentTransactionRequest {
  method: string;
  status: string;
  amount: number;
  providerTxnId?: string;
  orderId: string;
}

// Kitchen Job Types
export interface KitchenJob {
  id: string;
  orderId: string;
  bowlId: string;
  assignedUserId: string;
  status: string;
  note: string;
}

export interface KitchenJobRequest {
  status: string;
  note: string;
  orderId: string;
  bowlId: string;
  assignedUserId: string;
}

// Inventory Types
export interface Inventory {
  id: string;
  storeId: string;
  ingredientId: string;
  action: string;
  quantityChange: number;
  balanceAfter: number;
}

export interface InventoryRequest {
  action: string;
  quantityChange: number;
  note: string;
  storeId: string;
  ingredientId: string;
}

export enum PaymentMethod {
  CARD = 'CARD',
  CASH = 'CASH',
  WALLET = 'WALLET',
  TRANSFER = 'TRANSFER',
  ZALOPAY = 'ZALOPAY',
}


