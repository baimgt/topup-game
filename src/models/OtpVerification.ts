import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtpVerification extends Document {
  email: string;
  name: string;
  phone?: string;
  password: string; // hashed password
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerification>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 minutes in seconds
  },
  { timestamps: true }
);

const OtpVerification: Model<IOtpVerification> =
  mongoose.models.OtpVerification ||
  mongoose.model<IOtpVerification>("OtpVerification", OtpVerificationSchema);

export default OtpVerification;
