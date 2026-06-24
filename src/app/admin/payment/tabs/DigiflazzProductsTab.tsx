"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Search, Filter, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, Package, Zap, AlertTriangle,
  Database, CloudDownload,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

interface DigiProduct {
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  type: string;
  price: number;
  buyer_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  start_cut_off: string;
  end_cut_off: string;
  desc?: string;
  syncedAt?: string;
}

interface ProductData {
  products: DigiProduct[];
  grouped: Record<string, DigiProduct[]>;
  total: number;
  categories: string[];
  lastSync: string | null;
  isEmpty: boolean;
}

export default function DigiflazzProductsTab() {
  const [data, setData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [productType, setProductType] = useState<"prepaid" | "pasca">("prepaid");

  const token = () => localStorage.getItem("token") || "";

  // Load dari DB — cepat, tidak hit Digiflazz
  const loadFromDB = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: productType });
      if (search) params.set("search", search);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);

      const res = await fetch(`/api/admin/digiflazz-products?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        if (result.data.total > 0) {
          setExpandedCategories(new Set(result.data.categories.slice(0, 3)));
        }
      } else {
        toast.error(result.error || "Gagal memuat data");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    }
    setLoading(false);
  }, [productType, search, selectedCategory]);

  // Sync dari Digiflazz API → simpan ke DB
  const syncFromDigiflazz = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/digiflazz-products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ type: productType }),
      });
      const result = await res.json();

      if (res.status === 429 || result.rateLimited) {
        toast.error(`Rate limit — tunggu beberapa menit. Data DB: ${result.existingCount} produk`);
      } else if (result.success) {
        toast.success(result.message);
        await loadFromDB(); // Reload dari DB setelah sync
      } else {
        toast.error(result.error || "Gagal sync");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    }
    setSyncing(false);
  };

  // Load saat pertama buka atau ganti type
  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const expandAll = () => setExpandedCategories(new Set(data?.categories || []));
  const collapseAll = () => setExpandedCategories(new Set());

  // Filter client-side untuk search & category
  const filteredGrouped: Record<string, DigiProduct[]> = {};
  if (data) {
    const q = search.toLowerCase();
    for (const [cat, prods] of Object.entries(data.grouped)) {
      if (selectedCategory !== "ALL" && cat !== selectedCategory) continue;
      const filtered = q
        ? prods.filter(
            (p) =>
              p.product_name.toLowerCase().includes(q) ||
              p.buyer_sku_code.toLowerCase().includes(q) ||
              p.brand.toLowerCase().includes(q)
          )
        : prods;
      if (filtered.length > 0) filteredGrouped[cat] = filtered;
    }
  }

  const totalFiltered = Object.values(filteredGrouped).reduce((s, p) => s + p.length, 0);
  const activeCount = data?.products.filter((p) => p.buyer_product_status).length || 0;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-gaming-card rounded-xl border border-white/5 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          {/* Type selector */}
          <div className="flex items-center gap-1 bg-gaming-accent rounded-lg p-1">
            <button
              onClick={() => setProductType("prepaid")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${productType === "prepaid" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Prabayar
            </button>
            <button
              onClick={() => setProductType("pasca")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${productType === "pasca" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Pascabayar
            </button>
          </div>

          {/* Sync button — hit Digiflazz API */}
          <Button
            variant="primary"
            size="sm"
            onClick={syncFromDigiflazz}
            loading={syncing}
            className="flex-shrink-0"
          >
            <CloudDownload className="w-4 h-4" />
            {syncing ? "Menyinkronkan..." : "Sync dari Digiflazz"}
          </Button>

          {/* Reload dari DB */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadFromDB()}
            loading={loading && !syncing}
            className="flex-shrink-0"
          >
            <Database className="w-4 h-4" />
            Muat dari DB
          </Button>

          {/* Stats */}
          {data && data.total > 0 && (
            <div className="flex items-center gap-3 text-xs text-gray-400 ml-auto flex-wrap">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                {activeCount} aktif
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                {data.total - activeCount} nonaktif
              </span>
              <span className="text-gray-600">|</span>
              <span>{data.total} total</span>
            </div>
          )}
        </div>

        {/* Last sync info */}
        {data?.lastSync && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <RefreshCw className="w-3 h-3" />
            Terakhir sync:{" "}
            <span className="text-gray-400">
              {new Date(data.lastSync).toLocaleString("id-ID", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Search & filter — hanya tampil jika ada data */}
        {data && data.total > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama produk, SKU, atau brand..."
                className="w-full bg-gaming-accent border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gaming-accent border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">Semua Kategori ({data.categories.length})</option>
                {data.categories.map((c) => (
                  <option key={c} value={c}>
                    {c} ({data.grouped[c]?.length || 0})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-1">
              <button onClick={expandAll} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors">
                Buka semua
              </button>
              <button onClick={collapseAll} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors">
                Tutup semua
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty state — belum pernah sync */}
      {!loading && data?.isEmpty && (
        <div className="bg-gaming-card rounded-2xl border border-white/5 p-16 text-center">
          <CloudDownload className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Belum ada data produk Digiflazz</p>
          <p className="text-gray-600 text-sm mt-1 max-w-sm mx-auto">
            Klik <strong className="text-white">Sync dari Digiflazz</strong> untuk mengambil dan menyimpan daftar produk ke database. Setelah itu data akan selalu tersedia tanpa perlu sync ulang.
          </p>
          <div className="mt-5">
            <Button variant="primary" onClick={syncFromDigiflazz} loading={syncing}>
              <CloudDownload className="w-4 h-4" />
              Sync Sekarang
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-gaming-card rounded-2xl border border-white/5 p-16 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Memuat dari database...</p>
        </div>
      )}

      {/* Syncing overlay info */}
      {syncing && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
          <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full flex-shrink-0" />
          <p className="text-blue-300 text-sm">Mengambil data dari Digiflazz API dan menyimpan ke database...</p>
        </div>
      )}

      {/* Product list */}
      {!loading && !data?.isEmpty && (
        <>
          {search && (
            <div className="text-gray-400 text-sm px-1">
              Menampilkan <span className="text-white font-medium">{totalFiltered}</span> produk
              {search && <> untuk "<span className="text-purple-300">{search}</span>"</>}
            </div>
          )}

          {Object.keys(filteredGrouped).length === 0 ? (
            <div className="bg-gaming-card rounded-xl border border-white/5 p-10 text-center text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(filteredGrouped).map(([category, prods]) => {
                const isExpanded = expandedCategories.has(category);
                const activeInCat = prods.filter((p) => p.buyer_product_status).length;

                return (
                  <div key={category} className="bg-gaming-card rounded-xl border border-white/5 overflow-hidden">
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors text-left"
                    >
                      <Package className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-white font-medium text-sm flex-1">{category}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-400">{activeInCat} aktif</span>
                        <span className="text-gray-500">{prods.length} total</span>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {/* Products table */}
                    {isExpanded && (
                      <div className="border-t border-white/5 overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/5 bg-gaming-accent/30">
                              {(productType === "prepaid"
                                ? ["Nama Produk", "Brand", "SKU", "Harga", "Stok", "Status", "Cut Off"]
                                : ["Nama Produk", "Brand", "SKU", "Biaya Admin", "Komisi", "Status"]
                              ).map((h) => (
                                <th key={h} className="text-left text-gray-500 text-xs font-medium px-4 py-2.5 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {prods.map((p) => (
                              <tr
                                key={p.buyer_sku_code}
                                className={`border-b border-white/5 hover:bg-white/2 transition-colors ${!p.buyer_product_status ? "opacity-50" : ""}`}
                              >
                                <td className="px-4 py-2.5">
                                  <div className="text-white text-xs font-medium">{p.product_name}</div>
                                  {p.desc && <div className="text-gray-600 text-xs truncate max-w-48">{p.desc}</div>}
                                </td>
                                <td className="px-4 py-2.5 text-gray-300 text-xs whitespace-nowrap">{p.brand}</td>
                                <td className="px-4 py-2.5">
                                  <code className="text-purple-300 text-xs bg-purple-500/10 px-1.5 py-0.5 rounded">
                                    {p.buyer_sku_code}
                                  </code>
                                </td>
                                {productType === "prepaid" ? (
                                  <>
                                    <td className="px-4 py-2.5 text-right">
                                      <span className="text-white text-xs font-medium">{formatCurrency(p.price)}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      {p.unlimited_stock
                                        ? <span className="text-green-400 text-xs">∞</span>
                                        : <span className={`text-xs ${p.stock > 0 ? "text-white" : "text-red-400"}`}>{p.stock}</span>}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      {p.buyer_product_status
                                        ? <span className="inline-flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3 h-3" /> Aktif</span>
                                        : <span className="inline-flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3 h-3" /> Nonaktif</span>}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      {p.start_cut_off && p.end_cut_off
                                        ? <span className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{p.start_cut_off}–{p.end_cut_off}</span>
                                        : <span className="text-gray-700 text-xs">—</span>}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-4 py-2.5 text-right">
                                      <span className="text-white text-xs font-medium">{formatCurrency((p as any).admin || 0)}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      <span className="text-green-400 text-xs font-medium">{formatCurrency((p as any).commission || 0)}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      {p.buyer_product_status
                                        ? <span className="inline-flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3 h-3" /> Aktif</span>
                                        : <span className="inline-flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3 h-3" /> Nonaktif</span>}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info */}
          <div className="bg-gaming-card/50 border border-white/5 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 text-sm font-medium">Tentang Sync Produk</p>
                <ul className="text-gray-400 text-xs mt-1 space-y-0.5">
                  <li>• Data disimpan di database — tetap ada meski browser ditutup atau server restart</li>
                  <li>• Klik <strong className="text-white">Sync dari Digiflazz</strong> untuk memperbarui harga & status terbaru</li>
                  <li>• Jangan sync terlalu sering — Digiflazz membatasi request pricelist</li>
                  <li>• Gunakan <strong className="text-white">buyer_sku_code</strong> saat menambahkan produk ke game</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
