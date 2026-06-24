import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFlashSale extends Document {
  productId: mongoose.Types.ObjectId;
  discountPrice: number;
  stockTotal: number;
  stockLeft: number;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FlashSaleSchema = new Schema<IFlashSale>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    discountPrice: { type: Number, required: true },
    stockTotal: { type: Number, required: true },
    stockLeft: { type: Number, required: true },
    endTime: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FlashSale: Model<IFlashSale> =
  mongoose.models.FlashSale || mongoose.model<IFlashSale>("FlashSale", FlashSaleSchema);

export default FlashSale;
