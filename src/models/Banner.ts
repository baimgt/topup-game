import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBanner extends Document {
  bannerType: "text" | "image";
  title?: string;
  subtitle?: string;
  badge?: string;
  discount?: string;
  description?: string;
  bgGradient?: string;
  textColor?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    bannerType: { type: String, enum: ["text", "image"], default: "text" },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    badge: { type: String, default: "Promo", trim: true },
    discount: { type: String, trim: true },
    description: { type: String, trim: true },
    bgGradient: { type: String, trim: true },
    textColor: { type: String, default: "text-blue-400", trim: true },
    imageUrl: { type: String, trim: true },
    linkUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);

export default Banner;
