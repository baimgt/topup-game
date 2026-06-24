import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  sellingPrice: number;
  digiflazzSku: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    digiflazzSku: { type: String, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
