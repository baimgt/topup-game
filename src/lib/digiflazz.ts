import axios from "axios";
import crypto from "crypto";

const DIGIFLAZZ_BASE_URL = "https://api.digiflazz.com/v1";

// Ambil credentials dari env — bisa di-override dari DB nanti
function getCreds() {
  return {
    username: process.env.DIGIFLAZZ_USERNAME || "",
    apiKey: process.env.DIGIFLAZZ_API_KEY || "",
  };
}

// Apakah mode testing aktif (development)
const IS_TESTING = process.env.DIGIFLAZZ_TESTING === "true";

function makeSign(username: string, apiKey: string, refId: string): string {
  return crypto
    .createHash("md5")
    .update(`${username}${apiKey}${refId}`)
    .digest("hex");
}

function makePricelistSign(username: string, apiKey: string): string {
  return crypto
    .createHash("md5")
    .update(`${username}${apiKey}pricelist`)
    .digest("hex");
}

export interface DigiflazzProduct {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  sku: string;
  seller_product_status: boolean;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

export interface DigiflazzTransactionResult {
  ref_id: string;
  customer_no: string;
  buyer_sku_code: string;
  message: string;
  status: "Sukses" | "Gagal" | "Pending";
  rc: string;
  sn?: string;
  buyer_last_saldo?: number;
  price?: number;
}

export async function getPriceList(type: "prepaid" | "pasca" = "prepaid"): Promise<DigiflazzProduct[]> {
  const { username, apiKey } = getCreds();
  const sign = makePricelistSign(username, apiKey);

  const response = await axios.post(`${DIGIFLAZZ_BASE_URL}/price-list`, {
    cmd: type,
    username,
    sign,
  });

  return response.data.data || [];
}

export async function createTransaction(
  buyerSkuCode: string,
  customerNo: string,
  refId: string,
  options?: { username?: string; apiKey?: string; testing?: boolean }
): Promise<DigiflazzTransactionResult> {
  const username = options?.username || getCreds().username;
  const apiKey = options?.apiKey || getCreds().apiKey;
  const testing = options?.testing ?? IS_TESTING;

  const sign = makeSign(username, apiKey, refId);

  const payload: Record<string, unknown> = {
    username,
    buyer_sku_code: buyerSkuCode,
    customer_no: customerNo,
    ref_id: refId,
    sign,
  };

  // Tambahkan flag testing jika mode development
  if (testing) {
    payload.testing = true;
  }

  const response = await axios.post(`${DIGIFLAZZ_BASE_URL}/transaction`, payload);
  return response.data.data;
}

export async function checkTransactionStatus(
  refId: string,
  options?: { username?: string; apiKey?: string }
): Promise<DigiflazzTransactionResult> {
  const username = options?.username || getCreds().username;
  const apiKey = options?.apiKey || getCreds().apiKey;
  const sign = makeSign(username, apiKey, refId);

  const response = await axios.post(`${DIGIFLAZZ_BASE_URL}/transaction`, {
    username,
    buyer_sku_code: "",
    customer_no: "",
    ref_id: refId,
    sign,
    cmd: "inquiry-transaction",
  });

  return response.data.data;
}

export function generateRefId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF${timestamp}${random}`;
}

// Test case numbers untuk development
export const DIGIFLAZZ_TEST_CASES = {
  prepaid: {
    sukses: "087800001230",
    gagal: "087800001232",
    pendingSukses: "087800001233",
    pendingGagal: "087800001234",
    skuTest: "xld10",
  },
} as const;
