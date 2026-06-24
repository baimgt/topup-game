import mongoose, { Schema, Document, Model } from "mongoose";

import { PaymentStatus, OrderStatus } from "@/types";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
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
  gameId: mongoose.Types.ObjectId;
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
  notes?: string;
  orderItems: IOrderItem[];
  isFlashSale?: boolean;
  flashSaleDecremented?: boolean;
  ppn?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
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
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    gameName: { type: String, required: true },
    gameUserId: { type: String, required: true },
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
    notes: { type: String },
    orderItems: [OrderItemSchema],
    isFlashSale: { type: Boolean, default: false },
    flashSaleDecremented: { type: Boolean, default: false },
    ppn: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
