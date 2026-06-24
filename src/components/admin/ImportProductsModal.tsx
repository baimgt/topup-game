"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search, Check, ChevronDown, ChevronUp, Zap,
  AlertTriangle, RefreshCw, Package, ArrowRight,
  Database,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

interface DigiProduct {
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  price: number;
  buyer_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  desc?: string;
}

interface Game {
  _id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  preselectedGame?: Game; // jika ada, langsung ke step pilih produk
}

export default function ImportProductsModal({ open, onClose, onImported, preselectedGame }: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameSearch, setGameSearch] = useState("");

  const [digiProducts, setDigiProducts] = useState<DigiProduct[]>([]);
  const [grouped, setGrouped] = useState<Record<string, DigiProduct[]>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [marginType, setMarginType] = useState<"flat" | "percent">("flat");
  const [marginValue, setMarginValue] = useState(2000);
  const [importing, setImporting] = useState(false);

  const token = () => localStorage.getItem("token") || "";

  // Apakah sudah di step pilih produk
  const onProductStep = selectedGame !== null;

  // ── Effects ────────────────────────────────────────────────────────────────

  // Reset setiap kali modal dibuka/ditutup
  useEffect(() => {
    if (!open) return;

    // Reset pilihan produk
    setSelected(new Set());
    setProductSearch("");
    setSelectedCategory("ALL");

    if (preselectedGame) {
      // Langsung set game dan load produk
      setSelectedGame(preselectedGame);
    } else {
      // Kembali ke step pilih game
      setSelectedGame(null);
      setGameSearch("");
      // Load daftar game
      fetch("/api/games")
        .then((r) => r.json())
        .then((d) => { if (d.success) setGames(d.data); });
    }
  }, [open, preselectedGame]);

  // Load produk Digiflazz dari DB saat game dipilih
  useEffect(() => {
    if (!selectedGame) return;
    loadProducts();
  }, [selectedGame]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const loadProducts = async () => {
    setLoadingProducts(true);
    setDigiProducts([]);
    setGrouped({});
    try {
      const res = await fetch("/api/admin/digiflazz-products?type=prepaid", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDigiProducts(data.data.products);
        setGrouped(data.data.grouped);
        setIsEmpty(data.data.isEmpty);
        setExpandedCats(new Set(data.data.categories.slice(0, 3)));
      } else {
        toast.error(data.error || "Gagal memuat produk");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    }
    setLoadingProducts(false);
  };

  const toggleProduct = (sku: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  };

  const toggleCategorySelect = (cat: string) => {
    const prods = filteredGrouped[cat] || [];
    const allSelected = prods.every((p) => selected.has(p.buyer_sku_code));
    setSelected((prev) => {
      const next = new Set(prev);
      prods.forEach((p) =>
        allSelected ? next.delete(p.buyer_sku_code) : next.add(p.buyer_sku_code)
      );
      return next;
    });
  };

  const toggleExpandCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const previewPrice = (base: number) =>
    marginType === "percent"
      ? Math.ceil(base * (1 + marginValue / 100))
      : base + marginValue;

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filteredGrouped = useMemo(() => {
    const result: Record<string, DigiProduct[]> = {};
    const q = productSearch.toLowerCase();
    for (const [cat, prods] of Object.entries(grouped)) {
      if (selectedCategory !== "ALL" && cat !== selectedCategory) continue;
      const filtered = q
        ? prods.filter(
            (p) =>
              p.product_name.toLowerCase().includes(q) ||
              p.buyer_sku_code.toLowerCase().includes(q) ||
              p.brand.toLowerCase().includes(q)
          )
        : prods;
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [grouped, productSearch, selectedCategory]);

  const allCategories = Object.keys(grouped).sort();
  const selectedProducts = digiProducts.filter((p) => selected.has(p.buyer_sku_code));

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!selectedGame || selected.size === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          gameId: selectedGame._id,
          marginType,
          marginValue,
          products: selectedProducts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        onImported();
        onClose();
      } else {
        toast.error(data.error || "Gagal mengimport produk");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
    setImporting(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const modalTitle = onProductStep
    ? `Import Produk → ${selectedGame.name}`
    : "Pilih Game Tujuan";

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} size="lg">

      {/* ══ STEP 1: Pilih Game ══════════════════════════════════════════════ */}
      {!onProductStep && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={gameSearch}
              onChange={(e) => setGameSearch(e.target.value)}
              placeholder="Cari game..."
              autoFocus
              className="w-full bg-gaming-accent border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {games
              .filter((g) => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
              .map((game) => (
                <button
                  key={game._id}
                  onClick={() => setSelectedGame(game)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gaming-accent hover:bg-white/10 rounded-xl border border-white/5 hover:border-purple-500/40 transition-all text-left group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{game.name.charAt(0)}</span>
                  </div>
                  <span className="text-white text-sm font-medium flex-1">{game.name}</span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
                </button>
              ))}
            {games.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">Belum ada game.</p>
            )}
          </div>
        </div>
      )}

      {/* ══ STEP 2: Pilih Produk ════════════════════════════════════════════ */}
      {onProductStep && (
        <div className="space-y-4">
          {/* Back — hanya jika bukan preselected */}
          {!preselectedGame && (
            <button
              onClick={() => setSelectedGame(null)}
              className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              ← Ganti game
            </button>
          )}

          {/* DB empty warning */}
          {isEmpty && !loadingProducts && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 text-sm font-medium">Data produk Digiflazz belum tersedia</p>
                <p className="text-gray-400 text-xs mt-1">
                  Buka <strong className="text-white">Payment Gateway → Produk Digiflazz</strong> dan klik <strong className="text-white">Sync dari Digiflazz</strong> terlebih dahulu.
                </p>
              </div>
            </div>
          )}

          {/* Margin settings */}
          {!isEmpty && (
            <div className="bg-gaming-accent/60 rounded-xl border border-white/5 p-3">
              <p className="text-gray-300 text-xs font-medium mb-2">⚙️ Margin Harga Jual</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
                  <button
                    onClick={() => setMarginType("flat")}
                    className={`px-3 py-1.5 font-medium transition-colors ${marginType === "flat" ? "bg-purple-600 text-white" : "bg-gaming-dark text-gray-400 hover:text-white"}`}
                  >
                    + Rp
                  </button>
                  <button
                    onClick={() => setMarginType("percent")}
                    className={`px-3 py-1.5 font-medium transition-colors ${marginType === "percent" ? "bg-purple-600 text-white" : "bg-gaming-dark text-gray-400 hover:text-white"}`}
                  >
                    + %
                  </button>
                </div>
                <input
                  type="number"
                  value={marginValue}
                  onChange={(e) => setMarginValue(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-gaming-dark border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  min={0}
                  step={marginType === "percent" ? 0.5 : 500}
                />
                <span className="text-gray-500 text-xs">
                  {marginType === "flat"
                    ? `Jual = beli + ${formatCurrency(marginValue)}`
                    : `Jual = beli × ${(1 + marginValue / 100).toFixed(2)}`}
                </span>
              </div>
            </div>
          )}

          {/* Search + filter */}
          {!isEmpty && !loadingProducts && (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Cari nama, SKU, brand..."
                  className="w-full bg-gaming-accent border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gaming-accent border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 max-w-[160px]"
              >
                <option value="ALL">Semua Kategori</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={loadProducts}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Reload dari DB"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Select all / clear */}
          {!isEmpty && !loadingProducts && digiProducts.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                <span className="text-white font-semibold">{selected.size}</span> dipilih dari{" "}
                {Object.values(filteredGrouped).flat().length} produk
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const all = new Set<string>();
                    Object.values(filteredGrouped).flat().forEach((p) => all.add(p.buyer_sku_code));
                    setSelected(all);
                  }}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Pilih semua
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Hapus pilihan
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loadingProducts && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <Database className="w-4 h-4" /> Memuat dari database...
              </p>
            </div>
          )}

          {/* Product accordion */}
          {!loadingProducts && !isEmpty && (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {Object.keys(filteredGrouped).length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Tidak ada produk ditemukan
                </div>
              ) : (
                Object.entries(filteredGrouped).map(([cat, prods]) => {
                  const isExpanded = expandedCats.has(cat);
                  const catSelectedCount = prods.filter((p) => selected.has(p.buyer_sku_code)).length;
                  const allCatSelected = catSelectedCount === prods.length && prods.length > 0;

                  return (
                    <div key={cat} className="bg-gaming-accent/40 rounded-xl border border-white/5 overflow-hidden">
                      {/* Category row */}
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        {/* Category checkbox */}
                        <button
                          onClick={() => toggleCategorySelect(cat)}
                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                            allCatSelected
                              ? "bg-purple-600 border-purple-600"
                              : catSelectedCount > 0
                              ? "bg-purple-600/40 border-purple-500"
                              : "border-white/20 hover:border-purple-500"
                          }`}
                        >
                          {catSelectedCount > 0 && <Check className="w-2.5 h-2.5 text-white" />}
                        </button>

                        {/* Expand toggle */}
                        <button
                          onClick={() => toggleExpandCat(cat)}
                          className="flex-1 flex items-center gap-2 text-left"
                        >
                          <Package className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span className="text-white text-sm font-medium">{cat}</span>
                          <span className="text-gray-500 text-xs">
                            ({catSelectedCount}/{prods.length})
                          </span>
                          {isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                            : <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />}
                        </button>
                      </div>

                      {/* Product rows */}
                      {isExpanded && (
                        <div className="border-t border-white/5 divide-y divide-white/5">
                          {prods.map((p) => {
                            const isSelected = selected.has(p.buyer_sku_code);
                            const sellPrice = previewPrice(p.price);
                            const margin = sellPrice - p.price;

                            return (
                              <button
                                key={p.buyer_sku_code}
                                onClick={() => toggleProduct(p.buyer_sku_code)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                  isSelected ? "bg-purple-500/10" : "hover:bg-white/3"
                                } ${!p.buyer_product_status ? "opacity-40" : ""}`}
                              >
                                {/* Checkbox */}
                                <div
                                  className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                                    isSelected ? "bg-purple-600 border-purple-600" : "border-white/20"
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>

                                {/* Name + SKU */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs font-medium truncate">
                                    {p.product_name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <code className="text-purple-300 text-xs">{p.buyer_sku_code}</code>
                                    {!p.buyer_product_status && (
                                      <span className="text-red-400 text-xs">nonaktif</span>
                                    )}
                                  </div>
                                </div>

                                {/* Harga */}
                                <div className="text-right flex-shrink-0">
                                  <p className="text-white text-xs font-semibold">
                                    {formatCurrency(sellPrice)}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {formatCurrency(p.price)}{" "}
                                    <span className="text-green-400">+{formatCurrency(margin)}</span>
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Summary + Import button */}
          {selected.size > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">
                    {selected.size} produk → <span className="text-purple-300">{selectedGame.name}</span>
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Margin:{" "}
                    {marginType === "flat"
                      ? `+${formatCurrency(marginValue)}`
                      : `+${marginValue}%`}{" "}
                    per produk
                  </p>
                  {/* Preview 3 produk pertama */}
                  <div className="mt-1 space-y-0.5">
                    {selectedProducts.slice(0, 3).map((p) => (
                      <p key={p.buyer_sku_code} className="text-gray-500 text-xs truncate">
                        • {p.product_name} →{" "}
                        <span className="text-white">{formatCurrency(previewPrice(p.price))}</span>
                      </p>
                    ))}
                    {selected.size > 3 && (
                      <p className="text-gray-600 text-xs">...dan {selected.size - 3} lainnya</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  loading={importing}
                  className="flex-shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  Import {selected.size}
                </Button>
              </div>
            </div>
          )}

          {/* Warning produk nonaktif */}
          {selectedProducts.some((p) => !p.buyer_product_status) && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-xs">
                Beberapa produk yang dipilih sedang nonaktif di Digiflazz
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
