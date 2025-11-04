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
  id: string; // UUID as string
  fullName: string;
  email: string;
  goalCode?: string;
  role: string;
  status: string;
  imageUrl?: string;
  dateOfBirth?: string; // LocalDate format: "2025-10-30"
  address?: string;
  phone?: string;
  createdAt?: string; // ZonedDateTime for admin response
  // Frontend-only fields for compatibility
  gender?: string; // MALE, FEMALE, OTHER (frontend only)
}

export interface UserUpdateRequest {
  fullName: string; // Required in backend
  email: string; // Required in backend
  goalCode?: string;
  imageUrl?: string;
  dateOfBirth?: string; // LocalDate from backend
  address?: string;
  phone?: string;
  gender?: string; // Frontend only field, not sent to backend
  // Note: status is not included - use /soft-delete or /restore endpoints
  // Note: password updates should use separate endpoint
}

export interface UserCreateRequest {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  goalCode?: string;
  role?: 'ADMIN' | 'USER';
  // Additional fields for admin creation
  imageUrl?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
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
  name: string;
  unit: string;
  standardQuantity: number;
  unitPrice: number;
  categoryId: string; // UUID format: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  imageUrl: string;
  // Additional fields for compatibility
  id?: string; // Optional for compatibility
  description?: string; // Optional for compatibility
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }; // Optional for compatibility
}

export interface IngredientRequest {
  name: string;
  unit: string;
  standardQuantity: number;
  unitPrice: number;
  categoryId: string; // UUID format
  imageUrl: string;
}

// Bowl Template Types
export interface BowlTemplate {
  id: string;
  name: string;
  description: string;
  isActive?: boolean;
  active?: boolean; // backend may return 'active'
}

export interface BowlTemplateRequest {
  name: string;
  description: string;
  isActive?: boolean;
  active?: boolean; // backend may expect 'active'
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
  id: string; // UUID as string
  userId: string; // UUID as string
  storeId: string; // UUID as string
  status: string;
  subtotalAmount: number; // Double from backend
  promotionTotal: number; // Double from backend
  totalAmount: number; // Double from backend
  pickupAt?: string; // ISO string for OffsetDateTime (only in request)
  note?: string; // Only in request
  createdAt?: string; // ZonedDateTime from backend
  updatedAt?: string; // Not in backend DTO but kept for compatibility
  // New enriched fields from backend admin response
  userFullName?: string;
  user?: User;
  bowls?: Bowl[];
}

export interface OrderRequest {
  pickupAt?: string; // ISO string for OffsetDateTime
  note?: string;
  storeId: string; // UUID as string
  userId: string; // UUID as string
}

export interface UpdateOrderStatusRequest {
  status: string;
}

// Bowl Types
export interface Bowl {
  id: string;
  orderId: string;
  templateId: string;
  name: string;
  instruction: string;
  linePrice: number;
  // Enriched fields
  quantity?: number;
  totalPrice?: number;
  items?: BowlItem[];
  template?: BowlTemplate & {
    imageUrl?: string;
    createdAt?: string;
    // steps may be null in admin response
    steps?: TemplateStep[] | null;
  };
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
  // Embedded ingredient from backend admin/order response
  ingredient?: Ingredient;
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

// Pagination Types
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: PageResponse<T>;
  errorCode?: string;
  timestamp: string;
}


