import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITargetInputOption {
  label: string;
  value: string;
}

export interface ITargetInput {
  name: string;
  label?: string;
  placeholder?: string;
  type: string;
  options?: ITargetInputOption[];
}

export interface IGame extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  iconUrl?: string;
  category: string;
  statusCategory?: string;
  isActive: boolean;
  sortOrder: number;
  homeSortOrder: number;
  // SKU Digiflazz khusus untuk cek username — BUKAN produk jual
  checkUsernameSku?: string;
  isCheckAccountSupported: boolean;
  targetInputs?: ITargetInput[];
  targetFormat?: string; // "concat" | "space" | "pipe"
  categoryOrder?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    imageUrl: { type: String },
    bannerUrl: { type: String },
    iconUrl: { type: String },
    category: { type: String, required: true },
    statusCategory: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    homeSortOrder: { type: Number, default: 0 },
    checkUsernameSku: { type: String, default: "" },
    isCheckAccountSupported: { type: Boolean, default: false },
    targetFormat: { type: String, default: "concat" },
    categoryOrder: { type: [String], default: [] },
    targetInputs: [
      {
        name: { type: String, required: true },
        label: { type: String, default: "" },
        placeholder: { type: String, default: "" },
        type: { type: String, required: true, default: "text" },
        options: [
          {
            label: { type: String, default: "" },
            value: { type: String, default: "" },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// Hapus model yang di-cache saat hot-reload di development
if (mongoose.models.Game) {
  delete mongoose.models.Game;
}

const Game: Model<IGame> = mongoose.model<IGame>("Game", GameSchema);

export default Game;
