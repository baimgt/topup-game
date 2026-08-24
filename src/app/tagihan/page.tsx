"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Receipt,
  CreditCard,
  Mail,
  Phone,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Flame,
  FileText,
  Activity,
  Tv,
  Smartphone,
  Droplets,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface PascabayarProduct {
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  admin: number;
  commission: number;
  buyer_product_status: boolean;
}

interface InquiryResult {
  refId: string;
  sku: string;
  productName: string;
  customerNo: string;
  customerName: string;
  billAmount: number;
  adminFee: number;
  penalty: number;
  totalAmount: number;
  period: string;
  tariff: string;
  daya: number;
  lembarTagihan: number;
  detail: any[];
  message: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  category: string;
  fee: number;
  feeType: "flat" | "percent";
  icon?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  PLN: "⚡",
  BPJS: "🏥",
  PDAM: "💧",
  "Internet & TV": "🌐",
  "HP Pascabayar": "📱",
  Multifinance: "💳",
  "Gas Negara": "⛽",
};

export default function TagihanPascabayarPage() {
  const router = useRouter();

  // Data states
  const [products, setProducts] = useState<PascabayarProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState<string>("PLN");
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [customerNo, setCustomerNo] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Inquiry states
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryData, setInquiryData] = useState<InquiryResult | null>(null);

  // Payment states
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Fetch products
  useEffect(() => {
    async function loadPascaProducts() {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/pascabayar/products");
        const json = await res.json();
        if (json.success && json.data) {
          const list: PascabayarProduct[] = json.data.products || [];
          setProducts(list);
          const cats: string[] = json.data.categories || [];
          setCategories(cats);
          if (cats.length > 0) {
            setSelectedCategory(cats[0]);
          }
        }
      } catch (err) {
        toast.error("Gagal memuat daftar produk tagihan");
      }
      setLoadingProducts(false);
    }

    async function loadPaymentMethods() {
      try {
        const res = await fetch("/api/payment-methods");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPaymentMethods(json.data);
          if (json.data.length > 0) {
            setSelectedPaymentMethodId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load payment methods", err);
      }
    }

    loadPascaProducts();
    loadPaymentMethods();
  }, []);

  // Filter products by selected category & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        !selectedCategory ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchFilter ||
        p.product_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.buyer_sku_code?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchFilter]);

  // Set default SKU when filtered products change
  useEffect(() => {
    if (filteredProducts.length > 0) {
      // Prioritaskan SKU yang sedang dipilih jika masih ada di list
      if (!filteredProducts.some((p) => p.buyer_sku_code === selectedSku)) {
        setSelectedSku(filteredProducts[0].buyer_sku_code);
      }
    } else {
      setSelectedSku("");
    }
  }, [filteredProducts, selectedSku]);

  // Reset inquiry whenever SKU or customer number changes
  const handleCustomerNoChange = (val: string) => {
    setCustomerNo(val);
    if (inquiryData) {
      setInquiryData(null);
    }
  };

  const handleSkuChange = (sku: string) => {
    setSelectedSku(sku);
    if (inquiryData) {
      setInquiryData(null);
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.buyer_sku_code === selectedSku);
  }, [products, selectedSku]);

  // Handle Cek Tagihan (Inquiry)
  const handleInquiry = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedSku) {
      toast.error("Pilih layanan tagihan terlebih dahulu");
      return;
    }
    if (!customerNo.trim() || customerNo.trim().length < 4) {
      toast.error("Masukkan No. Pelanggan / ID Tagihan yang valid (min. 4 digit)");
      return;
    }

    setInquiryLoading(true);
    setInquiryData(null);

    try {
      const res = await fetch("/api/pascabayar/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedSku,
          customerNo: customerNo.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setInquiryData(data.data);
        toast.success("Tagihan berhasil ditemukan!");
      } else {
        toast.error(data.error || "Gagal memeriksa tagihan. Pastikan nomor ID benar.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server. Coba beberapa saat lagi.");
    } finally {
      setInquiryLoading(false);
    }
  };

  // Selected payment method fee calculation
  const selectedPaymentMethod = useMemo(() => {
    return paymentMethods.find((m) => m.id === selectedPaymentMethodId);
  }, [paymentMethods, selectedPaymentMethodId]);

  const paymentFee = useMemo(() => {
    if (!selectedPaymentMethod || !inquiryData) return 0;
    const base = inquiryData.totalAmount;
    return selectedPaymentMethod.feeType === "percent"
      ? Math.round(base * (selectedPaymentMethod.fee / 100))
      : selectedPaymentMethod.fee;
  }, [selectedPaymentMethod, inquiryData]);

  const grandTotal = useMemo(() => {
    if (!inquiryData) return 0;
    return inquiryData.totalAmount + paymentFee;
  }, [inquiryData, paymentFee]);

  // Handle Checkout / Bayar Tagihan
  const handlePayBill = async () => {
    if (!inquiryData) {
      toast.error("Harap cek tagihan terlebih dahulu");
      return;
    }
    if (!customerEmail || !customerEmail.includes("@")) {
      toast.error("Harap masukkan alamat email yang valid untuk bukti struk");
      return;
    }
    if (!selectedPaymentMethodId) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await fetch("/api/pascabayar/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: inquiryData.sku,
          productName: inquiryData.productName,
          customerNo: inquiryData.customerNo,
          customerName: inquiryData.customerName,
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
          refId: inquiryData.refId,
          billAmount: inquiryData.billAmount,
          adminFee: inquiryData.adminFee,
          penalty: inquiryData.penalty,
          period: inquiryData.period,
          tariff: inquiryData.tariff,
          daya: inquiryData.daya,
          lembarTagihan: inquiryData.lembarTagihan,
          detail: inquiryData.detail,
          paymentMethodId: selectedPaymentMethodId,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        toast.success("Order pembayaran tagihan berhasil dibuat!");

        // If Midtrans Snap token exists, trigger popup
        if (data.data.paymentToken && typeof window !== "undefined" && (window as any).snap) {
          (window as any).snap.pay(data.data.paymentToken, {
            onSuccess: () => {
              router.push(`/order/${data.data.orderNumber}`);
            },
            onPending: () => {
              router.push(`/order/${data.data.orderNumber}`);
            },
            onError: () => {
              router.push(`/order/${data.data.orderNumber}`);
            },
            onClose: () => {
              router.push(`/order/${data.data.orderNumber}`);
            },
          });
        } else {
          router.push(`/order/${data.data.orderNumber}`);
        }
      } else {
        toast.error(data.error || "Gagal membuat order pembayaran");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat memproses order");
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070512] text-white pt-24 pb-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-600/15 via-cyan-600/15 to-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-80 right-0 w-[400px] h-[400px] bg-purple-700/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold tracking-wide uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Layanan Resmi PPOB & Cek Tagihan 24 Jam</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400">
            Bayar Tagihan Bulanan Lebih Praktis
          </h1>

          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
            Cek dan bayar tagihan listrik PLN, BPJS Kesehatan, PDAM, Telkom Indihome, Pascabayar HP, dan cicilan Multifinance langsung lunas dengan bukti struk resmi.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-semibold text-gray-300">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Cek Tagihan Instan</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Terhubung Biller Resmi</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Struk Pembayaran Sah</span>
            </div>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2 backdrop-blur-xl shadow-2xl overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {categories.map((cat) => {
              const isSelected =
                selectedCategory?.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSearchFilter("");
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/40 scale-[1.02]"
                      : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
                  }`}
                >
                  <span className="text-base">{CATEGORY_ICONS[cat] || "🏷️"}</span>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 1 & 2: Form Pengecekan Tagihan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Form Input Layanan & No Pelanggan */}
          <div className="lg:col-span-6 bg-gaming-card border border-white/10 rounded-2xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black text-sm">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Pilih Layanan & Masukkan ID
                </h2>
                <p className="text-xs text-gray-400">
                  Pilih produk tagihan dan ketik nomor pelanggan Anda
                </p>
              </div>
            </div>

            <form onSubmit={handleInquiry} className="space-y-4">
              {/* Dropdown Produk / Biller */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Layanan / Biller Tagihan *
                </label>
                <select
                  value={selectedSku}
                  onChange={(e) => handleSkuChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all font-medium cursor-pointer"
                  disabled={loadingProducts}
                >
                  {filteredProducts.length === 0 ? (
                    <option value="">Tidak ada produk di kategori ini</option>
                  ) : (
                    filteredProducts.map((p) => (
                      <option key={p.buyer_sku_code} value={p.buyer_sku_code}>
                        {p.product_name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Input Nomor Pelanggan */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Nomor Pelanggan / ID Tagihan / No. Meter *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerNo}
                    onChange={(e) => handleCustomerNoChange(e.target.value)}
                    placeholder="Contoh: 530000000001 / No. Peserta"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all font-mono font-bold tracking-wide"
                    required
                  />
                  {customerNo && (
                    <button
                      type="button"
                      onClick={() => handleCustomerNoChange("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs px-1.5 py-0.5 rounded bg-white/10"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  💡 Pastikan nomor ID tagihan sudah sesuai dengan struk tagihan bulan sebelumnya.
                </p>
              </div>

              {/* Tombol Cek Tagihan */}
              <Button
                type="submit"
                variant="primary"
                loading={inquiryLoading}
                disabled={!selectedSku || !customerNo.trim()}
                className="w-full py-3.5 text-sm font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-transform"
              >
                <Search className="w-4 h-4" />
                <span>{inquiryLoading ? "Memeriksa Tagihan..." : "Cek Tagihan Sekarang"}</span>
              </Button>
            </form>

            {/* Panduan Singkat */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2 text-purple-300 font-bold">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>Informasi Pembayaran Pascabayar</span>
              </div>
              <ul className="space-y-1 pl-4 list-disc text-gray-400">
                <li>Tagihan PLN, BPJS, PDAM diperbarui otomatis setiap bulan oleh biller.</li>
                <li>Jika tagihan sudah lunas, sistem akan menampilkan status "Tagihan Sudah Lunas".</li>
                <li>Setelah pembayaran sukses, nomor referensi/SN struk sah akan otomatis dikirim ke email Anda.</li>
              </ul>
            </div>
          </div>

          {/* Kolom Kanan: Rincian Tagihan & Checkout (Muncul setelah Cek Tagihan) */}
          <div className="lg:col-span-6 space-y-6">
            {!inquiryData && (
              <div className="bg-gaming-card border border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-2xl animate-pulse">
                  🧾
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-white">
                    Rincian Tagihan Belum Dimuat
                  </h3>
                  <p className="text-xs text-gray-400">
                    Masukkan nomor ID pelanggan Anda di sebelah kiri dan klik tombol <strong>"Cek Tagihan Sekarang"</strong> untuk melihat rincian pemakaian dan total bayar.
                  </p>
                </div>
              </div>
            )}

            {/* Kartu Rincian Tagihan Resmi */}
            {inquiryData && (
              <div className="space-y-6 animate-fadeIn">
                {/* Rincian Tagihan */}
                <div className="bg-gradient-to-b from-[#130f2c] to-[#0d0922] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-3xl pointer-events-none" />

                  {/* Header Kartu */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🧾</span>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Rincian Tagihan Pelanggan
                        </h3>
                        <p className="text-[11px] text-cyan-300 font-mono">
                          {inquiryData.productName}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase">
                      ✓ Valid
                    </span>
                  </div>

                  {/* Info Pelanggan */}
                  <div className="py-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Nama Pelanggan</span>
                      <span className="text-white font-bold text-sm tracking-wide">
                        {inquiryData.customerName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">ID Pelanggan / No. Meter</span>
                      <span className="text-cyan-300 font-mono font-bold">
                        {inquiryData.customerNo}
                      </span>
                    </div>
                    {inquiryData.tariff && inquiryData.tariff !== "-" && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Tarif / Daya</span>
                        <span className="text-gray-200 font-semibold">
                          {inquiryData.tariff} {inquiryData.daya ? `(${inquiryData.daya} VA)` : ""}
                        </span>
                      </div>
                    )}
                    {inquiryData.period && inquiryData.period !== "-" && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Periode Tagihan</span>
                        <span className="text-gray-200 font-semibold">
                          {inquiryData.period}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Jumlah Lembar Tagihan</span>
                      <span className="text-gray-200 font-semibold">
                        {inquiryData.lembarTagihan} Bulan / Lembar
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Biaya */}
                  <div className="pt-4 border-t border-dashed border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Tagihan Pokok Biller</span>
                      <span className="text-gray-200 font-mono font-semibold">
                        {formatCurrency(inquiryData.billAmount)}
                      </span>
                    </div>
                    {inquiryData.penalty > 0 && (
                      <div className="flex items-center justify-between text-red-400">
                        <span>Denda Keterlambatan</span>
                        <span className="font-mono font-semibold">
                          +{formatCurrency(inquiryData.penalty)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Biaya Admin & Layanan</span>
                      <span className="text-gray-200 font-mono font-semibold">
                        {formatCurrency(inquiryData.adminFee)}
                      </span>
                    </div>
                    {paymentFee > 0 && (
                      <div className="flex items-center justify-between text-purple-300">
                        <span>Biaya Pembayaran ({selectedPaymentMethod?.name})</span>
                        <span className="font-mono font-semibold">
                          +{formatCurrency(paymentFee)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total Tagihan */}
                  <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">Total Pembayaran</span>
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Siap dibayar
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-300 font-mono">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Kontak & Metode Pembayaran */}
                <div className="bg-gaming-card border border-white/10 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black text-sm">
                      2
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        Kontak & Pembayaran
                      </h2>
                      <p className="text-xs text-gray-400">
                        Struk bukti pembayaran lunas akan dikirim ke email ini
                      </p>
                    </div>
                  </div>

                  {/* Input Email & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Email Penerima Struk *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="nama@email.com"
                          className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-3 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        No. WhatsApp (Opsional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="08123456789"
                          className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-3 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pilihan Metode Pembayaran */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">
                      Pilih Metode Pembayaran *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {paymentMethods.map((m) => {
                        const isSelected = selectedPaymentMethodId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedPaymentMethodId(m.id)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-purple-600/20 border-purple-500 shadow-md shadow-purple-500/20"
                                : "bg-black/30 border-white/10 hover:border-white/20"
                            }`}
                          >
                            <span className="text-xs font-bold text-white truncate">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {m.fee > 0
                                ? `Fee: ${m.feeType === "percent" ? `${m.fee}%` : formatCurrency(m.fee)}`
                                : "Bebas Biaya"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tombol Eksekusi Bayar */}
                  <Button
                    type="button"
                    variant="primary"
                    loading={submittingOrder}
                    onClick={handlePayBill}
                    className="w-full py-4 text-base font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-xl shadow-emerald-500/25 cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Bayar Tagihan Sekarang ({formatCurrency(grandTotal)})</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
