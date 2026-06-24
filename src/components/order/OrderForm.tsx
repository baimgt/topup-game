"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ShoppingCart, User, Mail, Hash, Server,
  CheckCircle, XCircle, Loader2, ChevronRight,
  Gamepad2, Info, ChevronDown, ChevronUp
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
}

const METHOD_ICONS: Record<string, string> = {
  gopay: "💚", shopeepay: "🟠", dana: "🔵", ovo: "🟣", linkaja: "🔴",
  qris: "📱", bca_va: "🏦", bni_va: "🏦", bri_va: "🏦",
  mandiri_va: "🏦", permata_va: "🏦", cimb_va: "🏦",
  indomaret: "🏪", alfamart: "🏪", credit_card: "💳",
};

const NEEDS_SERVER_ID = ["mobile-legends", "ml", "honor-of-kings", "arena-of-valor"];

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

  const hasCustomInputs = game.targetInputs && game.targetInputs.length > 0;

  // Account check
  // Jika game tidak mendukung cek akun, langsung set status menjadi unsupported
  const [checkStatus, setCheckStatus] = useState<CheckStatus>(game.isCheckAccountSupported && !hasCustomInputs ? "idle" : "unsupported");
  const [checkedUsername, setCheckedUsername] = useState("");
  const [checkedRegion, setCheckedRegion] = useState("");
  const [checkError, setCheckError] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsServerId = NEEDS_SERVER_ID.some((s) =>
    game.slug.toLowerCase().includes(s)
  );

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPaymentMethods(d.data); })
      .catch(() => {});
  }, []);

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
            ? game.targetInputs!.map(input => customInputs[input.name] || "").join(" | ")
            : userId.trim(),
          gameServerId: (!hasCustomInputs && needsServerId) ? serverId.trim() : undefined,
          customerName: customerName.trim() || "Guest",
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          paymentMethodId: selectedPaymentMethod.id,
          gameUsername: checkedUsername || undefined,
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

  const canProceed = !game.isCheckAccountSupported 
    ? (hasCustomInputs ? isCustomInputsValid : isStandardInputsValid) 
    : (checkStatus === "valid" || checkStatus === "unsupported");

  const basePrice = selectedProduct?.sellingPrice || 0;
  const ppnAmount = Math.round(basePrice * 0.11);
  const feeAmount = selectedPaymentMethod
    ? selectedPaymentMethod.feeType === "percent"
      ? Math.round(basePrice * (selectedPaymentMethod.fee / 100))
      : selectedPaymentMethod.fee
    : 0;
  const totalPayment = basePrice + feeAmount + ppnAmount;

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
              <div className="grid grid-cols-1 gap-3">
                {game.targetInputs!.map((input, idx) => (
                  <Input
                    key={idx}
                    label={input.name}
                    type={input.type}
                    placeholder={`Masukkan ${input.name}`}
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
            {game.isCheckAccountSupported && !hasCustomInputs && (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {game.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedProduct?.id === product.id}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>
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
        <div className={`bg-gaming-card rounded-2xl border p-5 transition-all duration-300 ${
          selectedProduct && customerEmail && customerPhone && canProceed ? "border-white/5" : "border-white/5 opacity-40 pointer-events-none select-none"
        }`}>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              selectedProduct && customerEmail && customerPhone && canProceed ? "bg-purple-500" : "bg-gray-600"
            }`}>4</span>
            Pilih Pembayaran
            {(!selectedProduct || !customerEmail || !customerPhone) && canProceed && (
              <span className="text-gray-500 text-xs font-normal ml-1">— lengkapi data sebelumnya</span>
            )}
          </h2>

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
                          ? Math.round((selectedProduct?.sellingPrice || 0) * (m.fee / 100))
                          : m.fee;

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
                              <p className="text-gray-400 text-xs mt-0.5">
                                {feeAmount === 0 ? "Bebas Biaya" : `+ ${formatCurrency(feeAmount)}`}
                              </p>
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

        {/* ── Ringkasan ────────────────────────────────────────────────────── */}
        {selectedProduct && customerName && customerEmail && customerPhone && canProceed && selectedPaymentMethod && (
          <div className="bg-gradient-to-br from-gaming-card to-gaming-dark rounded-2xl border border-purple-500/30 p-5 space-y-4 shadow-lg shadow-purple-500/5">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-cyan-400" /> Ringkasan Pembayaran
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Game</span>
                <span className="text-white font-medium">{game.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">ID Tujuan</span>
                <span className="text-white font-mono text-xs bg-white/5 px-2 py-0.5 rounded">
                  {hasCustomInputs 
                    ? game.targetInputs!.map(input => customInputs[input.name] || "").join(" | ")
                    : `${userId}${serverId ? ` / ${serverId}` : ""}`}
                </span>
              </div>
              {checkedUsername && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Nama Akun</span>
                  <span className="text-white font-medium">{checkedUsername}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Produk</span>
                <span className="text-white font-medium text-right max-w-[60%]">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Harga</span>
                <span className="text-white font-medium">{formatCurrency(basePrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">PPN (11%)</span>
                <span className="text-white font-medium">{formatCurrency(ppnAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Biaya Layanan</span>
                <span className="text-white font-medium">{formatCurrency(feeAmount)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
                <span className="text-gray-300 font-medium">Total Pembayaran</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-black text-xl">
                  {formatCurrency(totalPayment)}
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
