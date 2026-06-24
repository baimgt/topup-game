import midtransClient from "midtrans-client";
import crypto from "crypto";

// ── Midtrans payment method ID → Snap enabled_payments key ──────────────────
// Referensi: https://docs.midtrans.com/docs/snap-advanced-feature#enabled-payments
export const MIDTRANS_PAYMENT_MAP: Record<string, string[]> = {
  // E-Wallet
  gopay:      ["gopay"],
  shopeepay:  ["shopeepay"],
  dana:       ["dana"],
  ovo:        ["other_qris"],   // OVO via QRIS
  linkaja:    ["other_qris"],
  // Transfer Bank — Virtual Account
  bca_va:     ["bca_va"],
  bni_va:     ["bni_va"],
  bri_va:     ["bri_va"],
  mandiri_va: ["echannel"],     // Mandiri Bill Payment
  permata_va: ["permata_va"],
  cimb_va:    ["cimb_va"],
  // QRIS
  qris:       ["qris"],
  // Minimarket
  indomaret:  ["indomaret"],
  alfamart:   ["alfamart"],
  // Kartu
  credit_card: ["credit_card"],
};

function getSnapClient(serverKey: string, clientKey: string, isProduction: boolean) {
  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  });
}

function getCoreClient(serverKey: string, clientKey: string, isProduction: boolean) {
  return new midtransClient.CoreApi({
    isProduction,
    serverKey,
    clientKey,
  });
}

export interface MidtransTransactionParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  enabledPayments?: string[]; // Midtrans payment method IDs dari DB
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
}

export async function createSnapTransaction(
  params: MidtransTransactionParams
): Promise<{ token: string; redirect_url: string }> {
  const snap = getSnapClient(params.serverKey, params.clientKey, params.isProduction);

  // Konversi method IDs kita ke format Midtrans
  let enabledPayments: string[] | undefined;
  if (params.enabledPayments && params.enabledPayments.length > 0) {
    const mapped = params.enabledPayments.flatMap(
      (id) => MIDTRANS_PAYMENT_MAP[id] || []
    );
    // Deduplicate
    enabledPayments = [...new Set(mapped)];
  }

  const parameter: Record<string, unknown> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    item_details: params.items,
    callbacks: {
      finish:  `${process.env.NEXT_PUBLIC_APP_URL}/order/success`,
      error:   `${process.env.NEXT_PUBLIC_APP_URL}/order/failed`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/order/pending`,
    },
  };

  // Hanya kirim enabled_payments jika ada yang dikonfigurasi
  if (enabledPayments && enabledPayments.length > 0) {
    parameter.enabled_payments = enabledPayments;
  }

  const transaction = await snap.createTransaction(parameter);
  return transaction as { token: string; redirect_url: string };
}

export async function getTransactionStatus(
  orderId: string,
  serverKey: string,
  clientKey: string,
  isProduction: boolean
) {
  const core = getCoreClient(serverKey, clientKey, isProduction);
  return await core.transaction.status(orderId);
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string
): boolean {
  const hash = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return hash === signatureKey;
}
