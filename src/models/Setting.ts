import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISetting extends Document {
  siteName: string;
  siteLogo: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  instagramUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementImage: string;
  announcementUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    siteName: { type: String, default: "GamerStore" },
    siteLogo: { type: String, default: "" },
    siteDescription: { type: String, default: "Platform top up game terpercaya" },
    contactEmail: { type: String, default: "support@gametopup.com" },
    contactPhone: { type: String, default: "+62 812-3456-7890" },
    whatsappNumber: { type: String, default: "6281234567890" },
    instagramUrl: { type: String, default: "https://instagram.com/gametopup" },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "Website sedang dalam maintenance" },
    announcementEnabled: { type: Boolean, default: false },
    announcementText: { type: String, default: "" },
    announcementImage: { type: String, default: "" },
    announcementUrl: { type: String, default: "" },
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: "" },
    smtpPass: { type: String, default: "" },
    smtpFrom: { type: String, default: "" },
  },
  { timestamps: true }
);

const Setting: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>("Setting", SettingSchema);

export default Setting;
