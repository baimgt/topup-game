// File ini aman diimport dari client maupun server
// JANGAN import mongoose/prisma di sini

export interface PaymentMethod {
  id: string;
  name: string;
  group: string;
  enabled: boolean;
  fee: number;
  feeType: "flat" | "percent";
  iconUrl?: string;
}

export const defaultMethods: PaymentMethod[] = [
  // E-Wallet
  { id: "gopay",     name: "GoPay",     group: "E-Wallet", enabled: true,  fee: 0, feeType: "flat" },
  { id: "shopeepay", name: "ShopeePay", group: "E-Wallet", enabled: true,  fee: 0, feeType: "flat" },
  { id: "dana",      name: "DANA",      group: "E-Wallet", enabled: true,  fee: 0, feeType: "flat" },
  { id: "ovo",       name: "OVO",       group: "E-Wallet", enabled: false, fee: 0, feeType: "flat" },
  { id: "linkaja",   name: "LinkAja",   group: "E-Wallet", enabled: false, fee: 0, feeType: "flat" },
  // Transfer Bank
  { id: "bca_va",     name: "BCA Virtual Account",     group: "Transfer Bank", enabled: true,  fee: 4000, feeType: "flat" },
  { id: "bni_va",     name: "BNI Virtual Account",     group: "Transfer Bank", enabled: true,  fee: 4000, feeType: "flat" },
  { id: "bri_va",     name: "BRI Virtual Account",     group: "Transfer Bank", enabled: true,  fee: 4000, feeType: "flat" },
  { id: "mandiri_va", name: "Mandiri Virtual Account", group: "Transfer Bank", enabled: false, fee: 4000, feeType: "flat" },
  { id: "permata_va", name: "Permata Virtual Account", group: "Transfer Bank", enabled: false, fee: 4000, feeType: "flat" },
  { id: "cimb_va",    name: "CIMB Virtual Account",    group: "Transfer Bank", enabled: false, fee: 4000, feeType: "flat" },
  // QRIS
  { id: "qris", name: "QRIS", group: "QRIS", enabled: true, fee: 0.7, feeType: "percent" },
  // Minimarket
  { id: "indomaret", name: "Indomaret", group: "Minimarket", enabled: true, fee: 2500, feeType: "flat" },
  { id: "alfamart",  name: "Alfamart",  group: "Minimarket", enabled: true, fee: 2500, feeType: "flat" },
  // Kartu
  { id: "credit_card", name: "Kartu Kredit / Debit", group: "Kartu", enabled: false, fee: 2, feeType: "percent" },
];

export const defaultDuitkuMethods: PaymentMethod[] = [
  // E-Wallet
  { id: "SP", name: "ShopeePay App", group: "E-Wallet", enabled: true, fee: 1.5, feeType: "percent" },
  { id: "OV", name: "OVO", group: "E-Wallet", enabled: true, fee: 1.5, feeType: "percent" },
  { id: "DA", name: "DANA", group: "E-Wallet", enabled: true, fee: 1.5, feeType: "percent" },
  { id: "LA", name: "LinkAja", group: "E-Wallet", enabled: true, fee: 1.5, feeType: "percent" },
  // QRIS
  { id: "NQ", name: "QRIS Nobu", group: "QRIS", enabled: true, fee: 0.7, feeType: "percent" },
  { id: "SQ", name: "QRIS ShopeePay", group: "QRIS", enabled: false, fee: 0.7, feeType: "percent" },
  { id: "LQ", name: "QRIS LinkAja", group: "QRIS", enabled: false, fee: 0.7, feeType: "percent" },
  // Transfer Bank
  { id: "B1", name: "BCA Virtual Account", group: "Transfer Bank", enabled: true, fee: 4000, feeType: "flat" },
  { id: "M2", name: "Mandiri Virtual Account", group: "Transfer Bank", enabled: true, fee: 4000, feeType: "flat" },
  { id: "I1", name: "BNI Virtual Account", group: "Transfer Bank", enabled: true, fee: 4000, feeType: "flat" },
  { id: "BR", name: "BRI Virtual Account", group: "Transfer Bank", enabled: true, fee: 4000, feeType: "flat" },
  { id: "B8", name: "CIMB Virtual Account", group: "Transfer Bank", enabled: false, fee: 4000, feeType: "flat" },
  { id: "BT", name: "Permata Virtual Account", group: "Transfer Bank", enabled: false, fee: 4000, feeType: "flat" },
  { id: "D1", name: "Danamon Virtual Account", group: "Transfer Bank", enabled: false, fee: 4000, feeType: "flat" },
  { id: "M1", name: "Maybank Virtual Account", group: "Transfer Bank", enabled: false, fee: 4000, feeType: "flat" },
  { id: "A1", name: "ATM Bersama", group: "Transfer Bank", enabled: false, fee: 4000, feeType: "flat" },
  { id: "NC", name: "Bank Neo Commerce", group: "Transfer Bank", enabled: false, fee: 4000, feeType: "flat" },
  // Retail
  { id: "FT", name: "Alfamart", group: "Minimarket", enabled: true, fee: 2500, feeType: "flat" },
  { id: "IR", name: "Indomaret", group: "Minimarket", enabled: true, fee: 2500, feeType: "flat" },
  { id: "PG", name: "Pegadaian", group: "Minimarket", enabled: false, fee: 2500, feeType: "flat" },
  // Kartu
  { id: "VC", name: "Kartu Kredit / Debit", group: "Kartu", enabled: false, fee: 2.9, feeType: "percent" },
  // Paylater
  { id: "ID", name: "Indodana Paylater", group: "Paylater", enabled: false, fee: 2, feeType: "percent" },
  { id: "AK", name: "Akulaku Paylater", group: "Paylater", enabled: false, fee: 2, feeType: "percent" },
];
