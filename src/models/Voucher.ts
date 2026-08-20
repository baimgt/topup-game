import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVoucher extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  title: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minPurchase: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: Date;
  isActive: boolean;
  gameId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherSchema = new Schema<IVoucher>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    discountType: { type: String, enum: ["percent", "flat"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // 0 = unlimited
    usageLimit: { type: Number, default: 1000 },
    usedCount: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    gameId: { type: Schema.Types.ObjectId, ref: "Game" },
  },
  { timestamps: true }
);

VoucherSchema.index({ code: 1 });
VoucherSchema.index({ isActive: 1, expiryDate: 1 });

const Voucher: Model<IVoucher> =
  mongoose.models.Voucher || mongoose.model<IVoucher>("Voucher", VoucherSchema);

export default Voucher;
