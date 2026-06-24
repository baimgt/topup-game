import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentMethod {
  id: string;
  name: string;
  group: string;
  enabled: boolean;
  fee: number;
  feeType: "flat" | "percent";
  iconUrl?: string;
}

export interface IPaymentConfig extends Document {
  activePaymentGateway: "midtrans" | "duitku";
  midtransServerKey: string;
  midtransClientKey: string;
  midtransIsProduction: boolean;
  midtransEnabled: boolean;
  duitkuMerchantCode: string;
  duitkuApiKey: string;
  duitkuIsProduction: boolean;
  duitkuEnabled: boolean;
  digiflazzUsername: string;
  digiflazzApiKey: string;
  digiflazzWebhookSecret: string;
  digiflazzEnabled: boolean;
  paymentMethods: IPaymentMethod[];
  midtransMethods: IPaymentMethod[];
  duitkuMethods: IPaymentMethod[];
  updatedAt: Date;
  updatedBy: string;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    id: String,
    name: String,
    group: String,
    enabled: { type: Boolean, default: false },
    fee: { type: Number, default: 0 },
    feeType: { type: String, enum: ["flat", "percent"], default: "flat" },
    iconUrl: { type: String, default: "" },
  },
  { _id: false }
);

const PaymentConfigSchema = new Schema<IPaymentConfig>(
  {
    activePaymentGateway: { type: String, enum: ["midtrans", "duitku"], default: "midtrans" },
    midtransServerKey: { type: String, default: "" },
    midtransClientKey: { type: String, default: "" },
    midtransIsProduction: { type: Boolean, default: false },
    midtransEnabled: { type: Boolean, default: true },
    duitkuMerchantCode: { type: String, default: "" },
    duitkuApiKey: { type: String, default: "" },
    duitkuIsProduction: { type: Boolean, default: false },
    duitkuEnabled: { type: Boolean, default: true },
    digiflazzUsername: { type: String, default: "" },
    digiflazzApiKey: { type: String, default: "" },
    digiflazzWebhookSecret: { type: String, default: "" },
    digiflazzEnabled: { type: Boolean, default: true },
    paymentMethods: { type: [PaymentMethodSchema], default: [] },
    midtransMethods: { type: [PaymentMethodSchema], default: [] },
    duitkuMethods: { type: [PaymentMethodSchema], default: [] },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

const PaymentConfig: Model<IPaymentConfig> =
  mongoose.models.PaymentConfig ||
  mongoose.model<IPaymentConfig>("PaymentConfig", PaymentConfigSchema);

export default PaymentConfig;
