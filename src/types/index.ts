export interface TargetInputOption {
  label: string;
  value: string;
}

export interface TargetInput {
  name: string;
  label?: string;
  placeholder?: string;
  type: string;
  options?: TargetInputOption[];
}

export interface Game {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  iconUrl?: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  homeSortOrder?: number;
  isCheckAccountSupported: boolean;
  isVoucher?: boolean;
  targetInputs?: TargetInput[];
  targetFormat?: string;
  categoryOrder?: string[];
  products?: Product[];
  statusCategory?: string;
}

export interface Product {
  id: string;
  _id?: string;
  gameId: string;
  name: string;
  description?: string;
  price: number;
  sellingPrice: number;
  originalPrice?: number;
  isFlashSale?: boolean;
  digiflazzSku: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  gameId: string;
  gameName: string;
  gameUserId: string;
  gameServerId?: string;
  gameUsername?: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod?: string;
  paymentToken?: string;
  paymentUrl?: string;
  vaNumber?: string;
  qrString?: string;
  paidAt?: string;
  digiflazzRef?: string;
  sn?: string;
  isVoucher?: boolean;
  isPascabayar?: boolean;
  pascabayarData?: any;
  receiptNo?: string;
  notes?: string;
  isFlashSale?: boolean;
  flashSaleDecremented?: boolean;
  ppn?: number;
  voucherCode?: string;
  discountAmount?: number;
  subtotalAmount?: number;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: Product;
}

export type PaymentStatus = 
  | "UNPAID"
  | "PAID"
  | "EXPIRED"
  | "FAILED"
  | "REFUNDED";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CreateOrderRequest {
  productId: string;
  gameUserId: string;
  gameServerId?: string;
  customerName: string;
  customerEmail: string;
  paymentMethod?: string;
}

export interface MidtransNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: string;
  currency: string;
}
