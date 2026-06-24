import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDigiflazzProduct extends Document {
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  type: string;         // "prepaid" | "pasca"
  seller_name: string;
  // Prepaid fields
  price: number;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
  // Pascabayar-only fields
  admin: number;
  commission: number;
  syncedAt: Date;
}

const DigiflazzProductSchema = new Schema<IDigiflazzProduct>(
  {
    buyer_sku_code:        { type: String, required: true, unique: true },
    product_name:          { type: String, required: true },
    category:              { type: String, default: "" },
    brand:                 { type: String, default: "" },
    type:                  { type: String, default: "prepaid" },
    seller_name:           { type: String, default: "" },
    price:                 { type: Number, default: 0 },
    buyer_product_status:  { type: Boolean, default: false },
    seller_product_status: { type: Boolean, default: false },
    unlimited_stock:       { type: Boolean, default: false },
    stock:                 { type: Number, default: 0 },
    multi:                 { type: Boolean, default: false },
    start_cut_off:         { type: String, default: "" },
    end_cut_off:           { type: String, default: "" },
    desc:                  { type: String, default: "" },
    // Pascabayar fields
    admin:                 { type: Number, default: 0 },
    commission:            { type: Number, default: 0 },
    syncedAt:              { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index untuk query cepat
DigiflazzProductSchema.index({ category: 1 });
DigiflazzProductSchema.index({ brand: 1 });
DigiflazzProductSchema.index({ buyer_product_status: 1 });
DigiflazzProductSchema.index({ type: 1 });

const DigiflazzProduct: Model<IDigiflazzProduct> =
  mongoose.models.DigiflazzProduct ||
  mongoose.model<IDigiflazzProduct>("DigiflazzProduct", DigiflazzProductSchema);

export default DigiflazzProduct;
