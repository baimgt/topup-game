import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGame extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  category: string;
  statusCategory?: string;
  isActive: boolean;
  sortOrder: number;
  // SKU Digiflazz khusus untuk cek username — BUKAN produk jual
  checkUsernameSku?: string;
  isCheckAccountSupported: boolean;
  targetInputs?: { name: string; type: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    imageUrl: { type: String },
    category: { type: String, required: true },
    statusCategory: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    checkUsernameSku: { type: String, default: "" },
    isCheckAccountSupported: { type: Boolean, default: false },
    targetInputs: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
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
