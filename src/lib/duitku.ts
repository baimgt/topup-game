import crypto from "crypto";

interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  isProduction: boolean;
  appUrl?: string;
}

export async function createDuitkuTransaction(
  params: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    paymentMethod?: string;
    items: Array<{ name: string; price: number; quantity: number }>;
  },
  config: DuitkuConfig
) {
  const { merchantCode, apiKey, isProduction } = config;

  if (!merchantCode || !apiKey) {
    throw new Error("Duitku keys are not configured");
  }

  const endpoint = isProduction
    ? "https://passport.duitku.com/webapi/api/merchant/v2/inquiry"
    : "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry";

  // Hitung Signature: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
  const signatureString = `${merchantCode}${params.orderId}${params.amount}${apiKey}`;
  const signature = crypto.createHash("md5").update(signatureString).digest("hex");

  const baseUrl = config.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const payload: any = {
    merchantCode: merchantCode,
    paymentAmount: params.amount,
    merchantOrderId: params.orderId,
    productDetails: `Pembayaran Order ${params.orderId}`,
    email: params.customerEmail,
    phoneNumber: params.customerPhone || "081234567890", // Duitku needs a phone number for direct API
    customerVaName: params.customerName,
    itemDetails: params.items,
    callbackUrl: `${baseUrl}/api/payment/duitku`,
    returnUrl: `${baseUrl}/order/${params.orderId}`,
    signature: signature,
    expiryPeriod: 60, // 60 menit
  };

  // Gunakan Direct API V2 Inquiry (Option A)
  if (params.paymentMethod) {
    payload.paymentMethod = params.paymentMethod;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.statusCode === "00") {
      return {
        paymentUrl: data.paymentUrl,
        reference: data.reference,
        vaNumber: data.vaNumber,
        qrString: data.qrString,
      };
    } else {
      console.error("Duitku API Error Response:", JSON.stringify(data, null, 2));
      throw new Error(`Gagal membuat transaksi Duitku: ${JSON.stringify(data)}`);
    }
  } catch (error: any) {
    console.error("Duitku create transaction error:", error);
    throw new Error(`Duitku error: ${error.message}`);
  }
}

export function verifyDuitkuSignature(
  merchantCode: string,
  amount: number,
  merchantOrderId: string,
  apiKey: string,
  signature: string
): boolean {
  const signatureString = `${merchantCode}${amount}${merchantOrderId}${apiKey}`;
  const calculatedSignature = crypto.createHash("md5").update(signatureString).digest("hex");
  return calculatedSignature === signature;
}

export async function checkDuitkuTransactionStatus(
  orderId: string,
  config: DuitkuConfig
) {
  const { merchantCode, apiKey, isProduction } = config;

  if (!merchantCode || !apiKey) return null;

  const endpoint = isProduction
    ? "https://passport.duitku.com/webapi/api/merchant/transactionStatus"
    : "https://sandbox.duitku.com/webapi/api/merchant/transactionStatus";

  const signatureString = `${merchantCode}${orderId}${apiKey}`;
  const signature = crypto.createHash("md5").update(signatureString).digest("hex");

  const payload = {
    merchantCode,
    merchantOrderId: orderId,
    signature,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Duitku check status error:", error);
    return null;
  }
}
