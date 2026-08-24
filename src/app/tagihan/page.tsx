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
  FileText,
  HelpCircle,
  Layers,
  Check,
  Building2,
  HeartPulse,
  Wifi,
  Smartphone,
  Droplets,
  Fuel,
  Wallet,
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
  standMeter?: string;
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

const CATEGORY_META: Record<
  string,
  { icon: string; desc: string; placeholder: string; badgeColor: string }
> = {
  PLN: {
    icon: "⚡",
    desc: "Listrik Pascabayar & Non-Taglis",
    placeholder: "Masukkan 12 Digit Nomor Meter / ID Pelanggan PLN",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  BPJS: {
    icon: "🏥",
    desc: "BPJS Kesehatan & Ketenagakerjaan",
    placeholder: "Masukkan 13 Digit Nomor Kartu BPJS",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  PDAM: {
    icon: "💧",
    desc: "Air PDAM Seluruh Indonesia",
    placeholder: "Masukkan Nomor Pelanggan PDAM Anda",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  "Internet & TV": {
    icon: "🌐",
    desc: "Telkom, Indihome, Speedy, TV Kabel",
    placeholder: "Masukkan Nomor Pelanggan / ID Telepon",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  "HP Pascabayar": {
    icon: "📱",
    desc: "Kartu Halo, Indosat Matrix, XL Prioritas",
    placeholder: "Contoh: 0811xxxxxxxx / 0812xxxxxxxx",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  Multifinance: {
    icon: "💳",
    desc: "Cicilan FIF, BAF, WOM, Mega Auto",
    placeholder: "Masukkan Nomor Kontrak Perjanjian Cicilan",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
  "Gas Negara": {
    icon: "⛽",
    desc: "Gas Rumah Tangga & Industri PGN",
    placeholder: "Masukkan Nomor Pelanggan Gas PGN",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
  },
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
  const [paidModalInfo, setPaidModalInfo] = useState<{
    isOpen: boolean;
    customerNo: string;
    productName: string;
    message: string;
  }>({
    isOpen: false,
    customerNo: "",
    productName: "",
    message: "",
  });

  // Payment states
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState<string>("ALL");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Fetch products & payment methods
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

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        !selectedCategory ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchFilter ||
        p.product_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchFilter]);

  // Set default SKU when filtered products change
  useEffect(() => {
    if (filteredProducts.length > 0) {
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

  const activeCategoryMeta = useMemo(() => {
    return (
      CATEGORY_META[selectedCategory] || {
        icon: "🏷️",
        desc: "Layanan Tagihan Bulanan",
        placeholder: "Masukkan Nomor Pelanggan / ID Tagihan Anda",
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      }
    );
  }, [selectedCategory]);

  // Grouped Payment Methods
  const filteredPaymentMethods = useMemo(() => {
    if (paymentCategoryFilter === "ALL") return paymentMethods;
    return paymentMethods.filter(
      (m) =>
        m.category?.toLowerCase() === paymentCategoryFilter.toLowerCase() ||
        (paymentCategoryFilter === "E-WALLET" &&
          (m.id.toLowerCase().includes("shopee") ||
            m.id.toLowerCase().includes("gopay") ||
            m.id.toLowerCase().includes("dana") ||
            m.id.toLowerCase().includes("ovo") ||
            m.id.toLowerCase().includes("qris"))) ||
        (paymentCategoryFilter === "VA" &&
          (m.id.toLowerCase().includes("va") ||
            m.id.toLowerCase().includes("bca") ||
            m.id.toLowerCase().includes("bri") ||
            m.id.toLowerCase().includes("bni") ||
            m.id.toLowerCase().includes("mandiri")))
    );
  }, [paymentMethods, paymentCategoryFilter]);

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
      } else if (
        data.isPaid ||
        data.rc === "60" ||
        data.rc === "17" ||
        data.error?.toLowerCase().includes("lunas") ||
        data.error?.toLowerCase().includes("belum tersedia")
      ) {
        setPaidModalInfo({
          isOpen: true,
          customerNo: customerNo.trim(),
          productName: selectedProduct?.product_name || "Tagihan PLN Pascabayar",
          message:
            data.error ||
            "Tagihan untuk nomor ID pelanggan ini sudah lunas atau belum diterbitkan oleh biller resmi.",
        });
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
          standMeter: inquiryData.standMeter,
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pt-24 pb-28 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Soft Decorative Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-r from-indigo-100 via-purple-50 to-blue-100 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-96 -left-20 w-[400px] h-[400px] bg-indigo-50/80 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-10">
        {/* ── HERO BANNER SECTION ───────────────────────────────────── */}
        <div className="text-center space-y-3.5 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Layanan Resmi PPOB & Cek Tagihan 24 Jam Otomatis</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Bayar Tagihan Bulanan Lebih Praktis
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
            Cek dan bayar tagihan listrik PLN, BPJS Kesehatan, PDAM, Telkom Indihome, Pascabayar HP, dan cicilan Multifinance langsung lunas dengan bukti struk PDF resmi.
          </p>

          {/* Quick Trust Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Inquiry Detikan</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Struk PDF Resmi Biller</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Terhubung Biller Nasional</span>
            </div>
          </div>
        </div>

        {/* ── CATEGORY SWITCHER CARDS ──────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Pilih Kategori Layanan Tagihan</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {categories.length} Kategori Tersedia
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((cat) => {
              const isSelected = selectedCategory?.toLowerCase() === cat.toLowerCase();
              const meta = CATEGORY_META[cat] || {
                icon: "🏷️",
                desc: "Layanan Tagihan",
                badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
              };

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSearchFilter("");
                    if (inquiryData) setInquiryData(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative group ${
                    isSelected
                      ? "bg-white border-indigo-600 shadow-lg shadow-indigo-100 ring-2 ring-indigo-600/20 scale-[1.02]"
                      : "bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:border-slate-300"
                  }`}
                >
                  {/* Category Icon */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform ${
                        isSelected ? "bg-indigo-50 border-indigo-200" : ""
                      }`}
                    >
                      {meta.icon}
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm" />
                    )}
                  </div>

                  {/* Category Name */}
                  <div>
                    <h3
                      className={`text-xs font-bold tracking-tight line-clamp-1 ${
                        isSelected ? "text-indigo-700" : "text-slate-800"
                      }`}
                    >
                      {cat}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {meta.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MAIN 2-COLUMN WORKFLOW SECTION ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI: Step 1 (Pilih Biller & No Pelanggan) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Card Form Input */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 space-y-6">
              {/* Step Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-200">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Pilih Layanan & Masukkan ID
                    </h2>
                    <p className="text-xs text-slate-500">
                      Kategori aktif:{" "}
                      <span className="text-indigo-600 font-bold">
                        {selectedCategory}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-2xl">{activeCategoryMeta.icon}</span>
              </div>

              <form onSubmit={handleInquiry} className="space-y-5">
                {/* Visual Biller Options Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Layanan / Biller Tagihan *
                  </label>

                  {filteredProducts.length > 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {filteredProducts.map((p) => {
                        const isSelected = selectedSku === p.buyer_sku_code;
                        return (
                          <button
                            key={p.buyer_sku_code}
                            type="button"
                            onClick={() => handleSkuChange(p.buyer_sku_code)}
                            className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? "bg-indigo-50/70 border-indigo-500 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-500"
                                : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700 hover:text-slate-900"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">
                                {p.product_name}
                              </p>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {p.brand || selectedCategory}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-semibold flex items-center justify-between">
                      <span className="truncate">
                        {selectedProduct?.product_name || "Memuat produk..."}
                      </span>
                      <span className="text-xs text-indigo-600 font-bold">
                        ✓ Terpilih
                      </span>
                    </div>
                  )}
                </div>

                {/* Input Nomor Pelanggan / ID Tagihan */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nomor Pelanggan / ID Tagihan / No. Meter *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerNo}
                      onChange={(e) => handleCustomerNoChange(e.target.value)}
                      placeholder={activeCategoryMeta.placeholder}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-2xl px-4 py-3.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none transition-all font-mono font-bold tracking-wider shadow-inner"
                      required
                    />
                    {customerNo && (
                      <button
                        type="button"
                        onClick={() => handleCustomerNoChange("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded-lg bg-slate-200/60 hover:bg-slate-200 transition-colors font-medium"
                      >
                        ✕ Hapus
                      </button>
                    )}
                  </div>

                  {/* Contoh / Helper Shortcut Tag */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span>💡 Contoh Cek:</span>
                    <button
                      type="button"
                      onClick={() => handleCustomerNoChange("530000000001")}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono transition-colors font-semibold"
                    >
                      530000000001 (Tes Demo)
                    </button>
                    {selectedCategory === "PLN" && (
                      <button
                        type="button"
                        onClick={() => handleCustomerNoChange("325100174233")}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-mono transition-colors font-semibold"
                      >
                        325100174233 (PLN Anda)
                      </button>
                    )}
                  </div>
                </div>

                {/* Tombol Eksekusi Cek Tagihan */}
                <Button
                  type="submit"
                  variant="primary"
                  loading={inquiryLoading}
                  disabled={!selectedSku || !customerNo.trim()}
                  className="w-full py-4 text-sm font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/20 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <Search className="w-4 h-4" />
                  <span>
                    {inquiryLoading ? "Memeriksa Tagihan ke Server..." : "Cek Tagihan Sekarang"}
                  </span>
                </Button>
              </form>
            </div>

            {/* Panduan Pembayaran Pascabayar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 text-xs text-slate-600 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Ketentuan Tagihan Pascabayar</span>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-slate-500 leading-relaxed">
                <li>
                  Tagihan diperbarui otomatis setiap bulan sesuai jadwal rilis dari masing-masing biller (PLN, BPJS, PDAM, Telkom).
                </li>
                <li>
                  Jika tagihan Anda berstatus <strong>"Belum Tersedia / Lunas"</strong>, artinya tidak ada tunggakan pembayaran untuk periode berjalan.
                </li>
                <li>
                  Struk PDF resmi langsung dapat diunduh setelah pembayaran berhasil diverifikasi.
                </li>
              </ul>
            </div>
          </div>

          {/* KOLOM KANAN: Step 2 & 3 (Rincian Tagihan & Checkout) */}
          <div className="lg:col-span-6 space-y-6">
            {!inquiryData && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-4 min-h-[420px] shadow-sm">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl">
                  🧾
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-base font-bold text-slate-800">
                    Rincian Tagihan Belum Dimuat
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pilih layanan di sebelah kiri, masukkan nomor ID pelanggan Anda, lalu klik tombol{" "}
                    <strong className="text-indigo-600">"Cek Tagihan Sekarang"</strong> untuk melihat rincian pemakaian dan total bayar.
                  </p>
                </div>
              </div>
            )}

            {/* KARTU RINCIAN TAGIHAN RESMI (CLEAN WHITE DIGITAL RECEIPT) */}
            {inquiryData && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/60 relative overflow-hidden">
                  {/* Header Struk */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🧾</span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                          Rincian Tagihan Resmi
                        </h3>
                        <p className="text-xs text-indigo-600 font-semibold">
                          {inquiryData.productName}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi
                    </span>
                  </div>

                  {/* Info Pelanggan Detail */}
                  <div className="py-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nama Pelanggan</span>
                      <span className="text-slate-900 font-bold text-sm tracking-wide">
                        {inquiryData.customerName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ID Pelanggan / No. Meter</span>
                      <span className="text-indigo-600 font-mono font-bold text-sm">
                        {inquiryData.customerNo}
                      </span>
                    </div>
                    {inquiryData.tariff && inquiryData.tariff !== "-" && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Tarif / Daya</span>
                        <span className="text-slate-800 font-semibold">
                          {inquiryData.tariff} {inquiryData.daya ? `(${inquiryData.daya} VA)` : ""}
                        </span>
                      </div>
                    )}
                    {inquiryData.standMeter && inquiryData.standMeter !== "-" && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Stand Meter</span>
                        <span className="text-slate-900 font-mono font-semibold">
                          {inquiryData.standMeter}
                        </span>
                      </div>
                    )}
                    {inquiryData.period && inquiryData.period !== "-" && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Periode Tagihan</span>
                        <span className="text-slate-800 font-semibold">
                          {inquiryData.period}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Jumlah Lembar Tagihan</span>
                      <span className="text-slate-800 font-semibold">
                        {inquiryData.lembarTagihan} Bulan / Lembar
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Biaya */}
                  <div className="pt-4 border-t border-dashed border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tagihan Pokok Biller</span>
                      <span className="text-slate-900 font-mono font-semibold">
                        {formatCurrency(inquiryData.billAmount)}
                      </span>
                    </div>
                    {inquiryData.penalty > 0 && (
                      <div className="flex items-center justify-between text-red-600">
                        <span>Denda Keterlambatan</span>
                        <span className="font-mono font-semibold">
                          +{formatCurrency(inquiryData.penalty)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Biaya Admin Biller & Layanan</span>
                      <span className="text-slate-900 font-mono font-semibold">
                        {formatCurrency(inquiryData.adminFee)}
                      </span>
                    </div>
                    {paymentFee > 0 && (
                      <div className="flex items-center justify-between text-indigo-600">
                        <span>Biaya Pembayaran ({selectedPaymentMethod?.name})</span>
                        <span className="font-mono font-semibold">
                          +{formatCurrency(paymentFee)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total Tagihan */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl">
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Total Tagihan Siap Bayar</span>
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tagihan Aktif
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FORM KONTAK & PEMILIHAN METODE PEMBAYARAN */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 space-y-6">
                  {/* Step Header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-200">
                      2
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Kontak & Metode Pembayaran
                      </h2>
                      <p className="text-xs text-slate-500">
                        Struk PDF bukti lunas akan otomatis dikirim ke email ini
                      </p>
                    </div>
                  </div>

                  {/* Input Email & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Email Penerima Struk *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="nama@email.com"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl pl-10 pr-3 py-3 text-slate-900 text-xs focus:outline-none transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        No. WhatsApp (Opsional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="08123456789"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl pl-10 pr-3 py-3 text-slate-900 text-xs focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter Kategori Pembayaran */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Pilih Metode Pembayaran *
                      </label>
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setPaymentCategoryFilter("ALL")}
                          className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                            paymentCategoryFilter === "ALL"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentCategoryFilter("E-WALLET")}
                          className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                            paymentCategoryFilter === "E-WALLET"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          QRIS & E-Wallet
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentCategoryFilter("VA")}
                          className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                            paymentCategoryFilter === "VA"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Virtual Account
                        </button>
                      </div>
                    </div>

                    {/* Grid Metode Pembayaran */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {filteredPaymentMethods.map((m) => {
                        const isSelected = selectedPaymentMethodId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedPaymentMethodId(m.id)}
                            className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                              isSelected
                                ? "bg-indigo-50/80 border-indigo-600 shadow-md shadow-indigo-100 ring-1 ring-indigo-600"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {m.name}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono font-medium">
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
                    className="w-full py-4 text-base font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-600/20 rounded-2xl cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Bayar Tagihan Sekarang ({formatCurrency(grandTotal)})</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SECURITY & SERVICE GUARANTEE ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Pelunasan Otomatis 24 Jam</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pembayaran Anda langsung diproses ke sistem biller resmi tanpa jeda waktu manual.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Struk Sah & Legal</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dilengkapi nomor referensi SN resmi yang diakui oleh PLN, BPJS, PDAM, dan Telkom.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Pembayaran Aman Terenkripsi</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Didukung oleh Payment Gateway resmi berlisensi Bank Indonesia dengan enkripsi 256-bit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL POPUP: TAGIHAN SUDAH LUNAS / TIDAK ADA TAGIHAN ──────── */}
      {paidModalInfo.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-6">
            {/* Icon Header */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shadow-md shadow-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-wider">
                Status Tagihan Lunas
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 pt-1">
                Tidak Ada Tagihan Tertunggak
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                {paidModalInfo.message}
              </p>
            </div>

            {/* Information Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Layanan</span>
                <span className="text-slate-900 font-bold">{paidModalInfo.productName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ID Pelanggan</span>
                <span className="text-indigo-600 font-mono font-bold">{paidModalInfo.customerNo}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Status Pembayaran</span>
                <span className="text-emerald-600 font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS / NIHIL
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                onClick={() => setPaidModalInfo({ ...paidModalInfo, isOpen: false })}
                className="w-full py-3.5 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/20 rounded-xl cursor-pointer"
              >
                Tutup & Cek ID Lain
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
