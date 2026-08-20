"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ShoppingCart, User, Mail, Hash, Server,
  CheckCircle, XCircle, Loader2, ChevronRight,
  Gamepad2, Info, ChevronDown, ChevronUp, Tag, Sparkles, X
} from "lucide-react";
import { Game, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import ProductCard from "@/components/games/ProductCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface PaymentMethod {
  id: string;
  name: string;
  group: string;
  fee: number;
  feeType: "flat" | "percent";
  iconUrl?: string;
  icon?: string;
}

const METHOD_ICONS: Record<string, string> = {
  gopay: "💚", shopeepay: "🟠", dana: "🔵", ovo: "🟣", linkaja: "🔴",
  qris: "📱", bca_va: "🏦", bni_va: "🏦", bri_va: "🏦",
  mandiri_va: "🏦", permata_va: "🏦", cimb_va: "🏦",
  indomaret: "🏪", alfamart: "🏪", credit_card: "💳",
};

const NEEDS_SERVER_ID = ["mobile-legends", "ml", "honor-of-kings", "arena-of-valor"];

function formatCustomerNo(inputs: any[], values: Record<string, string>, format?: string) {
  if (!inputs || inputs.length === 0) return "";
  const vals = inputs.map(input => (values[input.name] || "").trim());
  if (vals.every(v => !v)) return "";

  const fmt = (format || "concat").trim();
  if (fmt === "concat") return vals.join("");
  if (fmt === "space") return vals.filter(Boolean).join(" ");
  if (fmt === "pipe") return vals.filter(Boolean).join(" | ");

  // Custom template pattern (e.g. "{1}{2}", "{User ID}-{Zone ID}", "{1} | {2}", etc.)
  if (fmt.includes("{")) {
    let result = fmt;
    inputs.forEach((input, idx) => {
      const val = (values[input.name] || "").trim();
      result = result.replace(new RegExp(`\\{${idx + 1}\\}`, "gi"), val);
      if (input.name) {
        result = result.replace(new RegExp(`\\{${escapeRegExp(input.name)}\\}`, "gi"), val);
      }
      if (input.label) {
        result = result.replace(new RegExp(`\\{${escapeRegExp(input.label)}\\}`, "gi"), val);
      }
    });
    return result;
  }

  // Otherwise fmt is used as separator character between inputs (e.g. "-", "#", "/", "@", "|")
  return vals.filter(Boolean).join(fmt);
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type CheckStatus = "idle" | "checking" | "valid" | "invalid" | "unsupported";

interface OrderFormProps {
  game: Game;
}

export default function OrderForm({ game }: OrderFormProps) {
  const router = useRouter();

  // Form state
  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product Category Filter Tab state
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("ALL");

  // Group & Sort products by category field per game
  const groupedProductsByCategory = useMemo(() => {
    if (!game.products || game.products.length === 0) return [];

    const flashSaleProducts: Product[] = [];
    const groupMap: Record<string, Product[]> = {};

    game.products.forEach((p) => {
      if (p.isFlashSale) {
        flashSaleProducts.push(p);
      }
      const cat = (p.category && p.category.trim()) || "Top Up";
      if (!groupMap[cat]) {
        groupMap[cat] = [];
      }
      groupMap[cat].push(p);
    });

    const entries = Object.entries(groupMap).map(([categoryName, products]) => ({
      categoryName,
      products,
    }));

    // Jika ada produk flash sale di game ini, tampilkan Kategori "⚡ Flash Sale" paling atas!
    if (flashSaleProducts.length > 0) {
      entries.unshift({
        categoryName: "⚡ Flash Sale",
        products: flashSaleProducts,
      });
    }

    const customOrderMap = new Map<string, number>();
    if (game.categoryOrder && Array.isArray(game.categoryOrder)) {
      game.categoryOrder.forEach((catName, idx) => {
        customOrderMap.set(catName.toLowerCase().trim(), idx);
      });
    }

    entries.sort((a, b) => {
      const nameA = a.categoryName.toLowerCase().trim();
      const nameB = b.categoryName.toLowerCase().trim();

      // Kategori ⚡ Flash Sale selalu berada di urutan TERATAS (Priority 0)
      if (nameA.includes("flash sale")) return -1;
      if (nameB.includes("flash sale")) return 1;

      if (customOrderMap.has(nameA) && customOrderMap.has(nameB)) {
        return customOrderMap.get(nameA)! - customOrderMap.get(nameB)!;
      }
      if (customOrderMap.has(nameA)) return -1;
      if (customOrderMap.has(nameB)) return 1;

      // Default priority: membership/pass/bulanan keywords next
      const isMemA = /bulanan|membership|pass|welkin|starlight|weekly|vip|blessing|subscribe/i.test(nameA);
      const isMemB = /bulanan|membership|pass|welkin|starlight|weekly|vip|blessing|subscribe/i.test(nameB);

      if (isMemA && !isMemB) return -1;
      if (!isMemA && isMemB) return 1;

      return 0;
    });

    return entries;
  }, [game.products, game.categoryOrder]);

  // Extract unique product categories in sorted order
  const productCategories = useMemo(() => {
    return groupedProductsByCategory.map((g) => g.categoryName);
  }, [groupedProductsByCategory]);

  const getCategoryTabIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes("flash sale")) {
      return "⚡";
    }
    if (lower.includes("membership") || lower.includes("pass") || lower.includes("welkin") || lower.includes("starlight") || lower.includes("weekly") || lower.includes("bulanan")) {
      return "👑";
    }
    if (lower.includes("top up") || lower.includes("diamond") || lower.includes("crystal") || lower.includes("uc") || lower.includes("vp")) {
      return "💎";
    }
    if (lower.includes("voucher") || lower.includes("bundle") || lower.includes("special")) {
      return "🎟️";
    }
    return "📦";
  };

  const hasCustomInputs = game.targetInputs && game.targetInputs.length > 0;

  // Tombol "Cek ID Akun" hanya muncul jika:
  // 1. Admin mengaktifkan isCheckAccountSupported di halaman admin, ATAU
  // 2. Game adalah Genshin Impact / Honor of Kings (punya auto-checker tanpa Digiflazz)
  const slugLower = (game.slug || "").toLowerCase();
  const isGenshinOrHOK = slugLower.includes("genshin") || slugLower.includes("honor-of-kings") || slugLower.includes("honor_of_kings");
  const isCheckSupported = !hasCustomInputs && (Boolean(game.isCheckAccountSupported) || isGenshinOrHOK);

  // Account check
  const [checkStatus, setCheckStatus] = useState<CheckStatus>(isCheckSupported ? "idle" : "unsupported");

  const [checkedUsername, setCheckedUsername] = useState("");
  const [checkedRegion, setCheckedRegion] = useState("");
  const [checkError, setCheckError] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Voucher state
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    title: string;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      toast.error("Masukkan kode promo terlebih dahulu");
      return;
    }
    if (!selectedProduct) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }

    setValidatingVoucher(true);
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherCodeInput.trim(),
          gameId: game.id || game._id,
          price: selectedProduct.sellingPrice,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAppliedVoucher({
          code: data.data.code,
          title: data.data.title,
          discountAmount: data.data.discountAmount,
          finalPrice: data.data.finalPrice,
        });
        toast.success(data.message);
      } else {
        toast.error(data.error || "Kode promo tidak valid");
      }
    } catch {
      toast.error("Gagal memvalidasi voucher");
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput("");
    toast.success("Kode promo dilepas");
  };

  const needsServerId = NEEDS_SERVER_ID.some((s) =>
    game.slug.toLowerCase().includes(s)
  );

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPaymentMethods(d.data); })
      .catch(() => {});
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);

    // Auto expand payment method groups
    if (Object.keys(groupedMethods).length > 0) {
      const firstGroup = Object.keys(groupedMethods)[0];
      setExpandedGroup((prev) => prev || firstGroup);
    }

    // Scroll smoothly to payment section if not chosen yet
    if (!selectedPaymentMethod) {
      setTimeout(() => {
        const paymentEl = document.getElementById("step-payment");
        if (paymentEl) {
          paymentEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    }
  };

  // Reset check saat userId/serverId berubah, tapi HANYA jika game mendukung cek akun
  useEffect(() => {
    if (game.isCheckAccountSupported && !hasCustomInputs && checkStatus !== "idle") {
      setCheckStatus("idle");
      setCheckedUsername("");
      setCheckError("");
    }
  }, [userId, serverId, game.isCheckAccountSupported, hasCustomInputs]);

  // Autofill user profile
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            if (data.data.email) setCustomerEmail(data.data.email);
            if (data.data.phone) setCustomerPhone(data.data.phone);
          }
        })
        .catch(() => {});
    }
  }, []);

  // ── Cek Akun ───────────────────────────────────────────────────────────────
  const handleCheckAccount = useCallback(async () => {
    if (hasCustomInputs) return;
    if (!userId.trim()) { toast.error("Masukkan ID akun game terlebih dahulu"); return; }
    if (needsServerId && !serverId.trim()) { toast.error("Masukkan Server ID terlebih dahulu"); return; }

    setCheckStatus("checking");
    setCheckedUsername("");
    setCheckError("");

    try {
      const res = await fetch("/api/check-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: game.slug,
          userId: userId.trim(),
          serverId: serverId.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.supported) {
        setCheckStatus("unsupported");
        toast("Fitur cek ID tidak tersedia untuk game ini", { icon: "ℹ️" });
        return;
      }

      if (data.success) {
        setCheckStatus("valid");
        setCheckedUsername(data.username || "");
        setCheckedRegion(data.region || "");
        setShowResultModal(true); // Tampilkan popup
      } else {
        setCheckStatus("invalid");
        setCheckError(data.error || "Akun tidak ditemukan");
        toast.error(data.error || "Akun tidak ditemukan");
      }
    } catch {
      setCheckStatus("invalid");
      setCheckError("Gagal mengecek akun, coba lagi");
      toast.error("Gagal mengecek akun");
    }
  }, [userId, serverId, game.slug, needsServerId, hasCustomInputs]);

  // ── Submit Order ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) { toast.error("Pilih nominal terlebih dahulu"); return; }
    
    if (hasCustomInputs) {
      for (const input of game.targetInputs!) {
        if (!customInputs[input.name]?.trim()) {
          toast.error(`${input.name} wajib diisi`);
          return;
        }
      }
    } else {
      if (!userId.trim()) { toast.error("ID akun game wajib diisi"); return; }
      if (needsServerId && !serverId.trim()) { toast.error("Server ID wajib diisi"); return; }
      if (game.isCheckAccountSupported && checkStatus !== "valid" && checkStatus !== "unsupported") { 
        toast.error("Silakan cek akun terlebih dahulu"); 
        return; 
      }
    }

    if (!selectedPaymentMethod) { toast.error("Metode pembayaran wajib dipilih"); return; }
    if (!customerEmail.trim()) { toast.error("Email wajib diisi"); return; }
    if (!customerPhone.trim()) { toast.error("Nomor WhatsApp wajib diisi"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          gameUserId: hasCustomInputs 
            ? formatCustomerNo(game.targetInputs!, customInputs, game.targetFormat)
            : userId.trim(),
          gameServerId: (!hasCustomInputs && needsServerId) ? serverId.trim() : undefined,
          customerName: customerName.trim() || "Guest",
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          paymentMethodId: selectedPaymentMethod.id,
          gameUsername: checkedUsername || undefined,
          voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) { toast.error(data.error || "Gagal membuat pesanan"); setSubmitting(false); return; }

      if (data.data.gateway === "midtrans" && typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(data.data.paymentToken, {
          onSuccess: function (result: any) {
            router.push(`/order/${data.data.orderNumber}`);
          },
          onPending: function (result: any) {
            router.push(`/order/${data.data.orderNumber}`);
          },
          onError: function (result: any) {
            toast.error("Pembayaran gagal atau dibatalkan");
            router.push(`/order/${data.data.orderNumber}`);
          },
          onClose: function () {
            toast.error("Anda menutup jendela pembayaran");
            router.push(`/order/${data.data.orderNumber}`);
          },
        });
      } else if (data.data.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        router.push(`/order/${data.data.orderNumber}`);
      }
    } catch {
      toast.error("Terjadi kesalahan, coba lagi");
      setSubmitting(false);
    }
  };

  const groupedMethods = paymentMethods.reduce<Record<string, PaymentMethod[]>>((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {});

  const isCustomInputsValid = hasCustomInputs 
    ? game.targetInputs?.every(input => (customInputs[input.name] || "").trim().length > 0)
    : false;

  const isStandardInputsValid = userId.trim().length > 0 && (!needsServerId || serverId.trim().length > 0);

  // canProceed: Cek ID Akun bersifat opsional (tombol cek tersedia, tapi tidak wajib sebelum lanjut)
  const canProceed = hasCustomInputs
    ? isCustomInputsValid
    : isStandardInputsValid;

  const basePrice = selectedProduct?.sellingPrice || 0;
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const priceAfterDiscount = Math.max(0, basePrice - discountAmount);

  const feeAmount = selectedPaymentMethod
    ? selectedPaymentMethod.feeType === "percent"
      ? Math.round(priceAfterDiscount * (selectedPaymentMethod.fee / 100))
      : selectedPaymentMethod.fee
    : 0;
  const ppnAmount = selectedProduct ? Math.round(priceAfterDiscount * 0.11) : 0;
  const totalPayment = selectedProduct ? priceAfterDiscount + feeAmount + ppnAmount : 0;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── STEP 1: ID Akun Game ─────────────────────────────────────────── */}
        <div className="bg-gaming-card rounded-2xl border border-white/5 p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            Masukkan Data Akun
          </h2>

          <div className="space-y-4">
            {hasCustomInputs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {game.targetInputs!.map((input, idx) => (
                  <Input
                    key={idx}
                    label={input.label || input.name}
                    type={input.type}
                    placeholder={input.placeholder || `Masukkan ${input.label || input.name}`}
                    value={customInputs[input.name] || ""}
                    onChange={(e) => setCustomInputs({ ...customInputs, [input.name]: e.target.value })}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={`User ID ${game.name}`}
                  placeholder="Contoh: 123456789"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  icon={<Hash className="w-4 h-4" />}
                />
                {needsServerId && (
                  <Input
                    label="Server ID"
                    placeholder="Contoh: 2345"
                    value={serverId}
                    onChange={(e) => setServerId(e.target.value)}
                    icon={<Server className="w-4 h-4" />}
                  />
                )}
              </div>
            )}

            {/* Jika Game Mendukung Cek Akun */}
            {isCheckSupported && !hasCustomInputs && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCheckAccount}
                  loading={checkStatus === "checking"}
                  disabled={!userId.trim() || (needsServerId && !serverId.trim())}
                  className="flex-shrink-0 w-full sm:w-auto"
                >
                  <Gamepad2 className="w-4 h-4" />
                  {checkStatus === "checking" ? "Memverifikasi..." : "Cek ID Akun"}
                </Button>

                {/* Status Singkat Inline */}
                <div className="flex-1">
                  {checkStatus === "idle" && (
                    <p className="text-gray-400 text-xs flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Klik untuk memverifikasi keaslian akun Anda
                    </p>
                  )}
                  {checkStatus === "valid" && (
                    <p className="text-green-400 text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Terverifikasi: {checkedUsername}
                    </p>
                  )}
                  {checkStatus === "invalid" && (
                    <p className="text-red-400 text-sm font-medium flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> {checkError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 2: Pilih Nominal ────────────────────────────────────────── */}
        <div className={`bg-gaming-card rounded-2xl border p-5 transition-all duration-300 ${
          canProceed ? "border-white/5" : "border-white/5 opacity-40 pointer-events-none select-none"
        }`}>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              canProceed ? "bg-purple-500" : "bg-gray-600"
            }`}>2</span>
            Pilih Nominal
            {!canProceed && game.isCheckAccountSupported && (
              <span className="text-gray-500 text-xs font-normal ml-1">
                {checkStatus === "idle" ? "— verifikasi ID dulu" :
                 checkStatus === "checking" ? "— sedang memverifikasi..." :
                 checkStatus === "invalid" ? "— ID tidak valid" : ""}
              </span>
            )}
            {!canProceed && !game.isCheckAccountSupported && (
              <span className="text-gray-500 text-xs font-normal ml-1">— masukkan ID dulu</span>
            )}
          </h2>

          {game.products && game.products.length > 0 ? (
            <>
              {/* Category Section Filter Tabs (Membership, Top Up, Pass, dll) */}
              {productCategories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none border-b border-white/5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryTab("ALL")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      selectedCategoryTab === "ALL"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400 scale-[1.02]"
                        : "bg-black/30 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>🌟</span>
                    <span>Semua ({game.products.length})</span>
                  </button>
                  {productCategories.map((cat) => {
                    const count = game.products?.filter(p => p.category?.trim().toLowerCase() === cat.toLowerCase()).length || 0;
                    const isSelected = selectedCategoryTab.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategoryTab(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400 scale-[1.02]"
                            : "bg-black/30 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span>{getCategoryTabIcon(cat)}</span>
                        <span>{cat}</span>
                        <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded-full font-mono">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Category Group Sections (Matching Screenshot Layout) */}
              <div className="space-y-6">
                {groupedProductsByCategory.map((group) => {
                  const isTabActive = selectedCategoryTab === "ALL" || selectedCategoryTab.toLowerCase() === group.categoryName.toLowerCase();
                  if (!isTabActive) return null;

                  return (
                    <div key={group.categoryName} className="space-y-3">
                      {/* Gradient Pill Badge Header */}
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-white font-extrabold text-xs sm:text-sm shadow-md tracking-wide ${
                          group.categoryName.toLowerCase().includes("flash sale")
                            ? "bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 shadow-red-500/30 animate-pulse border border-red-400/40"
                            : "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 shadow-pink-500/25"
                        }`}>
                          <span>{getCategoryTabIcon(group.categoryName)}</span>
                          <span>{group.categoryName}</span>
                        </div>
                      </div>

                      {/* Product Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {group.products.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            selected={selectedProduct?.id === product.id}
                            onSelect={handleProductSelect}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rincian Harga Produk Terpilih */}
              {selectedProduct && (
                <div className="mt-4 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold flex-shrink-0">
                      💎
                    </div>
                    <div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Nominal Terpilih</span>
                      <p className="text-white font-bold text-base mt-0.5">{selectedProduct.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Harga: {formatCurrency(basePrice)} + PPN (11%): {formatCurrency(ppnAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                    <span className="text-gray-400 text-xs">Harga Nominal + PPN</span>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-black text-lg">
                      {formatCurrency(basePrice + ppnAmount)}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">Tidak ada produk tersedia saat ini.</p>
          )}
        </div>

        {/* ── STEP 3: Data Pembeli ─────────────────────────────────────────── */}
        <div className={`bg-gaming-card rounded-2xl border p-5 transition-all duration-300 ${
          selectedProduct && canProceed ? "border-white/5" : "border-white/5 opacity-40 pointer-events-none select-none"
        }`}>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              selectedProduct && canProceed ? "bg-purple-500" : "bg-gray-600"
            }`}>3</span>
            Data Pembeli
            {!selectedProduct && canProceed && (
              <span className="text-gray-500 text-xs font-normal ml-1">— pilih nominal dulu</span>
            )}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Aktif"
              type="email"
              placeholder="email@contoh.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Nomor WhatsApp"
              type="tel"
              placeholder="081234567890"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
              icon={<Hash className="w-4 h-4" />}
            />
          </div>
          <p className="text-gray-600 text-xs mt-2">📧 Bukti pembelian akan dikirim ke email ini</p>
        </div>

        {/* ── STEP 4: Pilih Pembayaran ────────────────────────────────────────── */}
        <div id="step-payment" className={`bg-gaming-card rounded-2xl border p-5 transition-all duration-300 ${
          selectedProduct && canProceed ? "border-purple-500/40 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/10" : "border-white/5 opacity-40 pointer-events-none select-none"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                selectedPaymentMethod ? "bg-emerald-500 text-white" : selectedProduct ? "bg-amber-500 text-black font-black animate-pulse" : "bg-gray-600 text-white"
              }`}>4</span>
              Pilih Pembayaran
              {!selectedPaymentMethod && selectedProduct && (
                <span className="text-amber-400 text-xs font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse flex items-center gap-1">
                  ⚠️ WAJIB DIPILIH
                </span>
              )}
              {!selectedProduct && (
                <span className="text-gray-500 text-xs font-normal ml-1">— pilih produk dulu</span>
              )}
            </h2>

            {selectedPaymentMethod && (
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                {selectedPaymentMethod.name} Terpilih
              </span>
            )}
          </div>

          <div className="space-y-3">
            {Object.entries(groupedMethods).map(([group, methods]) => {
              const isExpanded = expandedGroup === group;
              return (
                <div key={group} className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(isExpanded ? null : group)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                  >
                    <h3 className="text-white font-semibold uppercase tracking-wider">{group}</h3>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/5 mt-2">
                      {methods.map((m) => {
                        const isSelected = selectedPaymentMethod?.id === m.id;
                        const feeAmount = m.feeType === "percent" 
                          ? Math.round(priceAfterDiscount * (m.fee / 100))
                          : m.fee;
                        const methodTotal = selectedProduct ? priceAfterDiscount + feeAmount + ppnAmount : 0;

                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedPaymentMethod(m)}
                            className={`flex items-center p-3 rounded-xl border text-left transition-all duration-200 ${
                              isSelected 
                                ? "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                                : "border-white/5 bg-black/20 hover:border-purple-500/50 hover:bg-white/5"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl flex-shrink-0 mr-3 border border-white/5 overflow-hidden">
                              {m.iconUrl ? (
                                <img src={m.iconUrl} alt={m.name} className="w-full h-full object-contain p-1" />
                              ) : (
                                METHOD_ICONS[m.id] || "💳"
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{m.name}</p>
                              <div className="flex flex-wrap items-center justify-between gap-1 mt-1">
                                <span className="text-gray-400 text-xs">
                                  {feeAmount === 0 ? "Bebas Biaya" : `+ ${formatCurrency(feeAmount)}`}
                                </span>
                                {selectedProduct && (
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                    isSelected 
                                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                                      : "bg-white/5 text-gray-300 border border-white/5"
                                  }`}>
                                    Total: {formatCurrency(methodTotal)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 5: Kode Promo / Voucher ─────────────────────────────────── */}
        <div className="bg-gaming-card rounded-2xl border border-white/5 p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
            Kode Promo / Voucher
          </h2>

          {appliedVoucher ? (
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-400 text-base">{appliedVoucher.code}</span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full">TERPASANG</span>
                  </div>
                  <p className="text-gray-300 text-xs mt-0.5">{appliedVoucher.title} — Diskon {formatCurrency(appliedVoucher.discountAmount)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveVoucher}
                className="text-gray-400 hover:text-red-400 p-2 hover:bg-white/5 rounded-lg transition-colors"
                title="Lepas Voucher"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Masukkan Kode Promo (contoh: PROMO10K)"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                  icon={<Tag className="w-5 h-5 text-gray-400" />}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                loading={validatingVoucher}
                onClick={handleApplyVoucher}
                disabled={!voucherCodeInput.trim() || !selectedProduct}
                className="px-6 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
              >
                Gunakan
              </Button>
            </div>
          )}
        </div>

        {/* ── Ringkasan Pembayaran ─────────────────────────────────────────── */}
        {selectedProduct && (
          <div className="bg-gradient-to-br from-gaming-card to-gaming-dark rounded-2xl border border-purple-500/30 p-5 space-y-4 shadow-lg shadow-purple-500/5">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-cyan-400" /> Ringkasan Pembayaran
              </h3>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-purple-500/30">
                Rincian Real-time
              </span>
            </div>
            
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Game</span>
                <span className="text-white font-medium">{game.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Produk</span>
                <span className="text-white font-medium text-right max-w-[60%]">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">ID Tujuan</span>
                <span className="text-white font-mono text-xs bg-white/5 px-2 py-0.5 rounded">
                  {hasCustomInputs 
                    ? (game.targetInputs!.map(input => customInputs[input.name] || "").filter(Boolean).join(" | ") || "Belum diisi")
                    : (userId ? `${userId}${serverId ? ` / ${serverId}` : ""}` : "Belum diisi")}
                </span>
              </div>
              {checkedUsername && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Nama Akun</span>
                  <span className="text-emerald-400 font-medium">{checkedUsername}</span>
                </div>
              )}

              <div className="border-t border-white/10 my-2 pt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Harga Nominal</span>
                  <span className="text-white font-medium">{formatCurrency(basePrice)}</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span className="flex items-center gap-1 font-medium"><Tag className="w-3.5 h-3.5" /> Diskon Promo ({appliedVoucher.code})</span>
                    <span className="font-bold">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">PPN (11%)</span>
                  <span className="text-white font-medium">{formatCurrency(ppnAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Biaya Layanan Payment Gateway</span>
                  {selectedPaymentMethod ? (
                    <span className="text-white font-medium">{feeAmount === 0 ? "Bebas Biaya (Rp 0)" : formatCurrency(feeAmount)}</span>
                  ) : (
                    <span className="text-yellow-400 text-xs italic">Pilih metode pembayaran (Step 4)</span>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
                <div>
                  <span className="text-gray-300 font-medium block">Total Pembayaran</span>
                  {!selectedPaymentMethod && (
                    <span className="text-gray-500 text-[11px]">Subtotal (Belum termasuk biaya pembayaran)</span>
                  )}
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-black text-xl">
                  {formatCurrency(totalPayment || (priceAfterDiscount + ppnAmount))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Tombol Bayar ─────────────────────────────────────────────────── */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          className="w-full h-14 text-lg font-bold shadow-[0_0_20px_rgba(157,78,221,0.3)]"
          disabled={
            !canProceed ||
            !selectedProduct ||
            !selectedPaymentMethod ||
            !customerEmail.trim() ||
            !customerPhone.trim()
          }
        >
          <ShoppingCart className="w-5 h-5" />
          {submitting ? "Memproses..." : `Bayar ${totalPayment > 0 ? formatCurrency(totalPayment) : "Sekarang"}`}
        </Button>
      </form>

      {/* ── Modal Hasil Cek Akun ─────────────────────────────────────────── */}
      <Modal open={showResultModal} onClose={() => setShowResultModal(false)} title="Detail Akun" size="sm">
        <div className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Akun Ditemukan!</h3>
          <p className="text-gray-400 text-sm mb-6">Pastikan data di bawah ini sudah sesuai dengan akun Anda.</p>
          
          <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Username in-game</span>
                <span className="text-lg font-black text-white">{checkedUsername}</span>
              </div>
              {checkedRegion && (
                <div className="flex justify-between items-center border-t border-white/5 pt-2">
                  <span className="text-xs text-gray-500 font-medium">Region</span>
                  <span className="text-sm font-bold text-cyan-400">{checkedRegion}</span>
                </div>
              )}
            </div>
            <div className="h-px w-full bg-white/5" />
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium">User ID</span>
                <span className="text-sm font-bold text-gray-300 font-mono">{userId}</span>
              </div>
              {needsServerId && serverId && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium">Server ID</span>
                  <span className="text-sm font-bold text-gray-300 font-mono">{serverId}</span>
                </div>
              )}
            </div>
          </div>

          <Button variant="primary" className="w-full" onClick={() => setShowResultModal(false)}>
            Ya, Lanjutkan Pembelian
          </Button>
        </div>
      </Modal>
    </>
  );
}
