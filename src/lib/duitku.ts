import crypto from "crypto";

interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  isProduction: boolean;
  appUrl?: string;
}

export const DUITKU_CHANNEL_MAP: Record<string, string> = {
  SP: "SA",   // ShopeePay App (Duitku live code is SA)
  M1: "VA",   // Maybank VA (Duitku live code is VA)
  D1: "DM",   // Danamon VA (Duitku live code is DM)
  BNC: "NC",  // Bank Neo Commerce VA
  BSI: "BV",  // BSI VA
};

export function normalizeDuitkuPaymentMethod(methodId?: string): string {
  if (!methodId) return "";
  const upper = methodId.toUpperCase();
  return DUITKU_CHANNEL_MAP[upper] || upper;
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

  const baseUrl = config.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://gamerstoreplus.com";

  let phone = (params.customerPhone || "").replace(/[^0-9]/g, "");
  if (phone.startsWith("62")) {
    phone = "0" + phone.slice(2);
  } else if (!phone.startsWith("0") && phone.length > 0) {
    phone = "08" + phone;
  }
  if (!phone || phone.length < 10) {
    phone = "081234567890";
  }

  const payload: any = {
    merchantCode: merchantCode,
    paymentAmount: params.amount,
    merchantOrderId: params.orderId,
    productDetails: `Pembayaran Order ${params.orderId}`,
    email: params.customerEmail,
    phoneNumber: phone,
    customerVaName: params.customerName,
    itemDetails: params.items,
    callbackUrl: `${baseUrl}/api/payment/duitku`,
    returnUrl: `${baseUrl}/order/${params.orderId}`,
    signature: signature,
    expiryPeriod: 60, // 60 menit
  };

  // Gunakan Direct API V2 Inquiry (Option A) dengan channel resmi Duitku
  const mappedMethod = normalizeDuitkuPaymentMethod(params.paymentMethod);
  if (mappedMethod) {
    payload.paymentMethod = mappedMethod;
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
      const rawMsg =
        data.statusMessage ||
        data.Message ||
        data.message ||
        data.responseMessage ||
        data.errorMessage ||
        `Gagal membuat transaksi Duitku (Kode ${data.statusCode || "Error"})`;

      let userMsg = rawMsg;
      if (
        rawMsg.toLowerCase().includes("payment channel not available") ||
        rawMsg.toLowerCase().includes("failed to generate")
      ) {
        userMsg = `Saluran pembayaran "${params.paymentMethod || ""}" belum aktif / tidak tersedia di akun Duitku Anda. Silakan gunakan QRIS, Transfer Bank VA, atau aktifkan saluran ini di dashboard Duitku.`;
      }
      throw new Error(userMsg);
    }
  } catch (error: any) {
    console.error("Duitku create transaction error:", error);
    throw new Error(error.message?.replace(/^Duitku error:\s*/i, "") || "Gagal membuat transaksi Duitku");
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
