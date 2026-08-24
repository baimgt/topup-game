import mongoose, { Schema, Document, Model } from "mongoose";

import { PaymentStatus, OrderStatus } from "@/types";

export interface IOrderItem {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  orderNumber: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  gameId?: mongoose.Types.ObjectId;
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
  paidAt?: Date;
  digiflazzRef?: string;
  digiflazzSku?: string;
  sn?: string; // Serial Number / Kode Voucher / No Referensi Biller
  isVoucher?: boolean;
  isPascabayar?: boolean;
  pascabayarData?: {
    buyerSkuCode?: string;
    productName?: string;
    customerNo?: string;
    customerName?: string;
    admin?: number;
    feeAdminStore?: number;
    billAmount?: number;
    penalty?: number;
    period?: string;
    tariff?: string;
    daya?: number;
    standMeter?: string;
    receiptUrl?: string;
    billCount?: number;
    detail?: any[];
  };
  receiptNo?: string;
  receiptUrl?: string;
  snSentAt?: Date; // Waktu pengiriman email SN / Struk
  notes?: string;
  orderItems: IOrderItem[];
  isFlashSale?: boolean;
  flashSaleDecremented?: boolean;
  ppn?: number;
  voucherCode?: string;
  discountAmount?: number;
  subtotalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    orderNumber: { type: String, required: true, unique: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    customerName: { type: String, default: "Guest" },
    gameId: { type: Schema.Types.ObjectId, ref: "Game" },
    gameName: { type: String, required: true },
    gameUserId: { type: String, default: "VOUCHER" },
    gameServerId: { type: String },
    gameUsername: { type: String },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "EXPIRED", "FAILED", "REFUNDED"],
      default: "UNPAID",
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    paymentMethod: { type: String },
    paymentToken: { type: String },
    paymentUrl: { type: String },
    vaNumber: { type: String },
    qrString: { type: String },
    paidAt: { type: Date },
    digiflazzRef: { type: String },
    digiflazzSku: { type: String },
    sn: { type: String },
    isVoucher: { type: Boolean, default: false },
    isPascabayar: { type: Boolean, default: false },
    pascabayarData: {
      buyerSkuCode: { type: String },
      productName: { type: String },
      customerNo: { type: String },
      customerName: { type: String },
      admin: { type: Number },
      feeAdminStore: { type: Number },
      billAmount: { type: Number },
      penalty: { type: Number },
      period: { type: String },
      tariff: { type: String },
      daya: { type: Number },
      standMeter: { type: String },
      receiptUrl: { type: String },
      billCount: { type: Number },
      detail: { type: Array },
    },
    receiptNo: { type: String },
    receiptUrl: { type: String },
    snSentAt: { type: Date },
    notes: { type: String },
    orderItems: [OrderItemSchema],
    isFlashSale: { type: Boolean, default: false },
    flashSaleDecremented: { type: Boolean, default: false },
    ppn: { type: Number, default: 0 },
    voucherCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    subtotalAmount: { type: Number },
  },
  { timestamps: true }
);

// ── Performance indexes ─────────────────────────────────────────────────────
// These significantly speed up the most common queries in the app
OrderSchema.index({ orderNumber: 1 }); // Order detail page lookup
OrderSchema.index({ customerEmail: 1, createdAt: -1 }); // My Orders page
OrderSchema.index({ userId: 1, createdAt: -1 }); // Logged-in user orders
OrderSchema.index({ paymentStatus: 1, orderStatus: 1 }); // Admin filtering
OrderSchema.index({ orderStatus: 1, createdAt: -1 }); // Recent transactions

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
