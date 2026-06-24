import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProfileOtp extends Document {
  userId: mongoose.Types.ObjectId;
  otp: string;
  type: "email" | "password" | "reset_password";
  expiresAt: Date;
  createdAt: Date;
}

const ProfileOtpSchema = new Schema<IProfileOtp>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    otp: { type: String, required: true },
    type: { type: String, enum: ["email", "password", "reset_password"], required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 minutes in seconds
  },
  { timestamps: true }
);

// Ensure a user only has one active OTP for a specific type (upsert will handle it)
ProfileOtpSchema.index({ userId: 1, type: 1 }, { unique: true });

const ProfileOtp: Model<IProfileOtp> =
  mongoose.models.ProfileOtp ||
  mongoose.model<IProfileOtp>("ProfileOtp", ProfileOtpSchema);

export default ProfileOtp;
