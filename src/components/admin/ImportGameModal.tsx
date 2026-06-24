"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search, Check, ChevronDown, ChevronUp, Zap,
  Gamepad2, Package, ArrowRight, RefreshCw, AlertTriangle,
  ShieldCheck, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────
const CHECK_KEYWORDS = [
  "cek username", "cek user", "check username", "check user",
  "cek akun", "cek id", "check id", "cek nama",
];

function isCheckProduct(name: string): boolean {
  const lower = name.toLowerCase();
  return CHECK_KEYWORDS.some((kw) => lower.includes(kw));
}

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Brand {
  brand: string;
  productCount: number;
  categories: string[];
  sampleProducts: { sku: string; name: string; price: number }[];
}

interface DigiProduct {
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  price: number;
  buyer_product_status: boolean;
}

const GAME_CATEGORIES = ["Mobile", "PC", "Console", "Battle Royale", "MOBA", "RPG", "Lainnya"];

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportGameModal({ open, onClose, onImported }: Props) {
  const [step, setStep] = useState<"brand" | "products">("brand");

  // Step 1
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Game info
  const [gameName, setGameName] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [gameCategory, setGameCategory] = useState("Mobile");
  const [gameDescription, setGameDescription] = useState("");

  // Step 2 — produk dibagi dua
  const [allProducts, setAllProducts] = useState<DigiProduct[]>([]); // semua dari API
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // SKU cek username — terpisah, otomatis terdeteksi
  const [checkUsernameSku, setCheckUsernameSku] = useState<DigiProduct | null>(null);

  // Margin
  const [marginType, setMarginType] = useState<"flat" | "percent">("flat");
  const [marginValue, setMarginValue] = useState(2000);
  const [importing, setImporting] = useState(false);

  const token = () => localStorage.getItem("token") || "";

  // ── Produk jual — tanpa produk cek username ─────────────────────────────────
  const sellProducts = useMemo(
    () => allProducts.filter((p) => !isCheckProduct(p.product_name)),
    [allProducts]
  );

  // Group produk jual
  const groupedProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    const filtered = q
      ? sellProducts.filter(
          (p) => p.product_name.toLowerCase().includes(q) || p.buyer_sku_code.toLowerCase().includes(q)
        )
      : sellProducts;
    return filtered.reduce<Record<string, DigiProduct[]>>((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {});
  }, [sellProducts, productSearch]);

  // Reset saat modal dibuka
  useEffect(() => {
    if (!open) return;
    setStep("brand");
    setSelectedBrand(null);
    setSelectedSkus(new Set());
    setProductSearch("");
    setBrandSearch("");
    setCheckUsernameSku(null);
    setAllProducts([]);
    loadBrands();
  }, [open]);

  const loadBrands = async () => {
    setLoadingBrands(true);
    const res = await fetch("/api/admin/digiflazz-brands?type=prepaid", {
      headers: { Authorization: `Bearer ${token()}` },
    });
    const data = await res.json();
    if (data.success) setBrands(data.data);
    else toast.error(data.error || "Gagal memuat brand");
    setLoadingBrands(false);
  };

  const loadProducts = async (brand: string) => {
    setLoadingProducts(true);
    const res = await fetch(
      `/api/admin/digiflazz-products?type=prepaid&brand=${encodeURIComponent(brand)}`,
      { headers: { Authorization: `Bearer ${token()}` } }
    );
    const data = await res.json();
    if (data.success) {
      const prods: DigiProduct[] = data.data.products;
      setAllProducts(prods);

      // ── Pisahkan produk cek username ──────────────────────────────────────
      const checkProd = prods.find((p) => isCheckProduct(p.product_name));
      setCheckUsernameSku(checkProd || null);

      // Produk jual saja (tanpa cek username)
      const sell = prods.filter((p) => !isCheckProduct(p.product_name));

      // Auto-expand & auto-select semua produk jual aktif
      setExpandedCats(new Set(sell.map((p) => p.category)));
      setSelectedSkus(new Set(sell.filter((p) => p.buyer_product_status).map((p) => p.buyer_sku_code)));

      if (sell.length === 0 && !checkProd) {
        toast("Tidak ada produk untuk brand ini. Coba sync ulang.", { icon: "⚠️" });
      }
    } else {
      toast.error(data.error || "Gagal memuat produk");
    }
    setLoadingProducts(false);
  };

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setGameName(brand.brand);
    setGameSlug(slugify(brand.brand));
    setGameDescription(`Top up ${brand.brand} murah, cepat, dan aman`);
    const cats = brand.categories.map((c) => c.toLowerCase());
    if (cats.some((c) => c.includes("game") || c.includes("voucher"))) setGameCategory("Mobile");
    else setGameCategory("Lainnya");
    setStep("products");
    loadProducts(brand.brand);
  };

  const toggleSku = (sku: string) => {
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  };

  const toggleCat = (cat: string, prods: DigiProduct[]) => {
    const allSel = prods.every((p) => selectedSkus.has(p.buyer_sku_code));
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      prods.forEach((p) => allSel ? next.delete(p.buyer_sku_code) : next.add(p.buyer_sku_code));
      return next;
    });
  };

  const previewPrice = (base: number) =>
    marginType === "percent" ? Math.ceil(base * (1 + marginValue / 100)) : base + marginValue;

  const handleImport = async () => {
    if (!selectedBrand || selectedSkus.size === 0) {
      toast.error("Pilih minimal 1 produk");
      return;
    }
    if (!gameName.trim() || !gameSlug.trim()) {
      toast.error("Nama dan slug game wajib diisi");
      return;
    }

    setImporting(true);
    const res = await fetch("/api/admin/import-game", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        brand: selectedBrand.brand,
        gameName: gameName.trim(),
        gameSlug: gameSlug.trim(),
        gameCategory,
        gameDescription: gameDescription.trim(),
        marginType,
        marginValue,
        // Kirim produk jual saja
        selectedSkus: Array.from(selectedSkus),
        // SKU cek username dikirim terpisah
        checkUsernameSku: checkUsernameSku?.buyer_sku_code || "",
      }),
    });

    const data = await res.json();
    if (data.success) {
      toast.success(data.message);
      onImported();
      onClose();
    } else {
      toast.error(data.error || "Gagal mengimport game");
    }
    setImporting(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === "brand" ? "Tambah Game dari Digiflazz" : `Setup: ${gameName}`}
      size="lg"
    >
      {/* ══ STEP 1: Pilih Brand ══════════════════════════════════════════════ */}
      {step === "brand" && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Pilih brand/game dari produk Digiflazz yang sudah tersync.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Cari brand..."
              autoFocus
              className="w-full bg-gaming-accent border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {loadingBrands && <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" /></div>}
          {!loadingBrands && brands.length === 0 && (
            <div className="text-center py-10">
              <Zap className="w-10 h-10 text-purple-400/30 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Data Digiflazz belum ada</p>
              <p className="text-gray-600 text-xs mt-1">Sync dulu di Payment Gateway → Produk Digiflazz</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={loadBrands} loading={loadingBrands}><RefreshCw className="w-4 h-4" /> Coba Lagi</Button>
            </div>
          )}
          {!loadingBrands && brands.length > 0 && (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {brands.filter((b) => b.brand.toLowerCase().includes(brandSearch.toLowerCase())).map((brand) => (
                <button key={brand.brand} onClick={() => handleSelectBrand(brand)}
                  className="w-full flex items-center gap-4 px-4 py-3 bg-gaming-accent hover:bg-white/10 rounded-xl border border-white/5 hover:border-purple-500/40 transition-all text-left group">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{brand.brand.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">{brand.brand}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-gray-500 text-xs">{brand.productCount} produk</span>
                      <span className="text-gray-700 text-xs">•</span>
                      <span className="text-gray-500 text-xs truncate">{brand.categories.slice(0, 2).join(", ")}</span>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {brand.sampleProducts.slice(0, 3).map((p) => (
                        <span key={p.sku} className="text-gray-600 text-xs bg-gaming-dark px-1.5 py-0.5 rounded">
                          {p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 2: Setup Game + Pilih Produk ═══════════════════════════════ */}
      {step === "products" && selectedBrand && (
        <div className="space-y-4">
          <button onClick={() => setStep("brand")} className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition-colors">
            ← Pilih brand lain
          </button>

          {/* Game info */}
          <div className="bg-gaming-accent/50 rounded-xl border border-white/5 p-4 space-y-3">
            <p className="text-white text-sm font-medium flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-purple-400" /> Info Game
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nama Game" value={gameName} onChange={(e) => { setGameName(e.target.value); setGameSlug(slugify(e.target.value)); }} />
              <Input label="Slug (URL)" value={gameSlug} onChange={(e) => setGameSlug(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Kategori</label>
                <select value={gameCategory} onChange={(e) => setGameCategory(e.target.value)}
                  className="w-full bg-gaming-dark border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {GAME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Deskripsi (opsional)" value={gameDescription} onChange={(e) => setGameDescription(e.target.value)} />
            </div>
          </div>

          {/* ── SKU Cek Username — terpisah, informasi saja ── */}
          {checkUsernameSku && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-blue-300 text-sm font-medium">SKU Cek Username Terdeteksi</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Produk ini akan digunakan untuk verifikasi ID akun user — <strong className="text-white">tidak dijual</strong> ke customer.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <code className="bg-gaming-dark text-blue-300 text-xs px-2 py-1 rounded font-mono">
                      {checkUsernameSku.buyer_sku_code}
                    </code>
                    <span className="text-gray-400 text-xs">{checkUsernameSku.product_name}</span>
                    <span className="text-gray-500 text-xs">{formatCurrency(checkUsernameSku.price)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Margin */}
          <div className="bg-gaming-accent/50 rounded-xl border border-white/5 p-4">
            <p className="text-white text-sm font-medium mb-3">⚙️ Margin Harga Jual (untuk produk di bawah)</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
                <button onClick={() => setMarginType("flat")} className={`px-3 py-1.5 font-medium transition-colors ${marginType === "flat" ? "bg-purple-600 text-white" : "bg-gaming-dark text-gray-400 hover:text-white"}`}>+ Rp</button>
                <button onClick={() => setMarginType("percent")} className={`px-3 py-1.5 font-medium transition-colors ${marginType === "percent" ? "bg-purple-600 text-white" : "bg-gaming-dark text-gray-400 hover:text-white"}`}>+ %</button>
              </div>
              <input type="number" value={marginValue} onChange={(e) => setMarginValue(parseFloat(e.target.value) || 0)}
                className="w-24 bg-gaming-dark border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                min={0} step={marginType === "percent" ? 0.5 : 500} />
              <span className="text-gray-500 text-xs">
                {marginType === "flat" ? `Jual = beli + ${formatCurrency(marginValue)}` : `Jual = beli × ${(1 + marginValue / 100).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Search + select all */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Cari produk jual..."
                className="w-full bg-gaming-accent border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <span className="text-white font-semibold text-xs">{selectedSkus.size}</span>
            <span className="text-gray-500 text-xs">dipilih</span>
            <button onClick={() => setSelectedSkus(new Set(sellProducts.filter(p => p.buyer_product_status).map(p => p.buyer_sku_code)))}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap">Pilih semua</button>
            <button onClick={() => setSelectedSkus(new Set())} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Hapus</button>
          </div>

          {/* Product list (hanya produk jual) */}
          {loadingProducts ? (
            <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" /></div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {Object.keys(groupedProducts).length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Tidak ada produk jual ditemukan
                </div>
              )}
              {Object.entries(groupedProducts).map(([cat, prods]) => {
                const isExpanded = expandedCats.has(cat);
                const catSel = prods.filter((p) => selectedSkus.has(p.buyer_sku_code)).length;
                const allCatSel = catSel === prods.length;
                return (
                  <div key={cat} className="bg-gaming-accent/40 rounded-xl border border-white/5 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <button onClick={() => toggleCat(cat, prods)}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${allCatSel ? "bg-purple-600 border-purple-600" : catSel > 0 ? "bg-purple-600/40 border-purple-500" : "border-white/20 hover:border-purple-500"}`}>
                        {catSel > 0 && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <button onClick={() => setExpandedCats((prev) => { const next = new Set(prev); next.has(cat) ? next.delete(cat) : next.add(cat); return next; })}
                        className="flex-1 flex items-center gap-2 text-left">
                        <Package className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-white text-sm font-medium">{cat}</span>
                        <span className="text-gray-500 text-xs">({catSel}/{prods.length})</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-white/5 divide-y divide-white/5">
                        {prods.map((p) => {
                          const isSel = selectedSkus.has(p.buyer_sku_code);
                          const sell = previewPrice(p.price);
                          return (
                            <button key={p.buyer_sku_code} onClick={() => toggleSku(p.buyer_sku_code)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSel ? "bg-purple-500/10" : "hover:bg-white/3"} ${!p.buyer_product_status ? "opacity-40" : ""}`}>
                              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${isSel ? "bg-purple-600 border-purple-600" : "border-white/20"}`}>
                                {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{p.product_name}</p>
                                <code className="text-purple-300 text-xs">{p.buyer_sku_code}</code>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-white text-xs font-semibold">{formatCurrency(sell)}</p>
                                <p className="text-gray-500 text-xs">{formatCurrency(p.price)} <span className="text-green-400">+{formatCurrency(sell - p.price)}</span></p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Warning produk nonaktif */}
          {Array.from(selectedSkus).some((sku) => { const p = sellProducts.find((x) => x.buyer_sku_code === sku); return p && !p.buyer_product_status; }) && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-xs">Beberapa produk yang dipilih sedang nonaktif di Digiflazz</p>
            </div>
          )}

          {/* Summary + Import */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-white text-sm font-medium">
                Buat game <span className="text-purple-300">"{gameName}"</span> dengan <span className="font-bold">{selectedSkus.size}</span> produk jual
              </p>
              {checkUsernameSku && (
                <p className="text-blue-400 text-xs mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  SKU cek username: <code className="font-mono">{checkUsernameSku.buyer_sku_code}</code>
                </p>
              )}
              <p className="text-gray-400 text-xs mt-0.5">
                Margin: {marginType === "flat" ? `+${formatCurrency(marginValue)}` : `+${marginValue}%`}
              </p>
            </div>
            <Button variant="primary" onClick={handleImport} loading={importing}
              disabled={selectedSkus.size === 0 || !gameName.trim()} className="flex-shrink-0">
              <Zap className="w-4 h-4" /> Buat Game
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
