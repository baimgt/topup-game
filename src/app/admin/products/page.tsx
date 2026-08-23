"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, ToggleLeft, ToggleRight, Pencil, Trash2, Zap, ArrowDownUp, RefreshCw, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import ImportProductsModal from "@/components/admin/ImportProductsModal";

function EditProductModal({
  product,
  gameCategories = [],
  onClose,
  onSaved,
}: {
  product: any;
  gameCategories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name || "",
    description: product.description || "",
    price: product.price || 0,
    sellingPrice: product.sellingPrice || 0,
    digiflazzSku: product.digiflazzSku || "",
    category: product.category || "",
    sortOrder: product.sortOrder || 0,
  });
  const [saving, setSaving] = useState(false);

  const margin = form.sellingPrice - form.price;
  const marginPct = form.price > 0 ? ((margin / form.price) * 100).toFixed(0) : "0";

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Produk berhasil diupdate");
      onSaved();
      onClose();
    } else {
      toast.error(data.error || "Gagal menyimpan");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Input label="Nama Produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Harga Modal (Rp)" type="number" value={String(form.price)} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
        <Input label="Harga Jual (Rp)" type="number" value={String(form.sellingPrice)} onChange={(e) => setForm({ ...form, sellingPrice: parseInt(e.target.value) || 0 })} />
      </div>
      <div className={`rounded-lg px-4 py-2 text-sm ${margin >= 0 ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
        Margin: {formatCurrency(margin)} ({marginPct}%)
      </div>
      <Input label="SKU Digiflazz" value={form.digiflazzSku} onChange={(e) => setForm({ ...form, digiflazzSku: e.target.value })} />
      <div>
        <Input label="Kategori Produk *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Top Up, Bulanan, Pass, Voucher, dll" />
        {gameCategories && gameCategories.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <span className="text-[11px] text-gray-400 font-medium">Kategori yang Sudah Ada di Game Ini:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {gameCategories.map((cat) => {
                const isSelected = form.category?.trim().toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-semibold flex items-center gap-1 ${
                      isSelected
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                        : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                    }`}
                  >
                    <span>🏷️</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi (opsional)</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm" />
      </div>
      <Input label="Urutan Tampil" type="number" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
        <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Simpan</Button>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("ALL");
  const [games, setGames] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<any | null>(null);

  // Sync & Auto-Sort States
  const [syncingDigi, setSyncingDigi] = useState(false);
  const [sortingLoading, setSortingLoading] = useState(false);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [bulkCategoryName, setBulkCategoryName] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  const selectedGameForImport = useMemo(() => {
    if (gameFilter === "ALL") return undefined;
    return games.find((g) => (g._id || g.id) === gameFilter);
  }, [gameFilter, games]);

  const fetchProducts = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/products", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setProducts(data.data);
    }
    setLoading(false);
  };

  const fetchGames = async () => {
    const res = await fetch("/api/games");
    const data = await res.json();
    if (data.success) setGames(data.data);
  };

  useEffect(() => {
    fetchProducts();
    fetchGames();
  }, []);

  // Filter and sort products
  useEffect(() => {
    let result = products;
    if (search) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.digiflazzSku.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (gameFilter !== "ALL") {
      result = result.filter((p) => (p.gameId?._id || p.gameId) === gameFilter);
    }
    const sorted = [...result].sort(
      (a, b) =>
        (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
        a.sellingPrice - b.sellingPrice
    );
    setFiltered(sorted);
  }, [search, gameFilter, products]);

  // Sync Digiflazz live prices & product status
  const handleSyncDigiflazz = async () => {
    setSyncingDigi(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/admin/digiflazz-products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "prepaid" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Harga & produk berhasil disinkronkan dari Digiflazz!");
        fetchProducts();
      } else {
        toast.error(data.error || "Gagal sinkronisasi Digiflazz");
      }
    } catch {
      toast.error("Terjadi kesalahan saat sinkronisasi Digiflazz");
    }
    setSyncingDigi(false);
  };

  // Auto Sort Handler
  const handleAutoSort = async (mode: "price_asc" | "nominal_asc" | "name_asc" = "price_asc") => {
    setSortingLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/admin/products/auto-sort", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          gameId: gameFilter === "ALL" ? "all" : gameFilter,
          mode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Produk berhasil diurutkan otomatis!");
        fetchProducts();
      } else {
        toast.error(data.error || "Gagal mengurutkan produk");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengurutkan produk");
    }
    setSortingLoading(false);
  };

  // Manual Update Sort Order
  const updateProductSortOrder = async (productId: string, newSort: number) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, sortOrder: newSort } : p))
    );
    const token = localStorage.getItem("token");
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sortOrder: newSort }),
      });
      toast.success("Urutan produk disimpan!");
    } catch {
      toast.error("Gagal menyimpan urutan produk");
    }
  };

  // Quick Move Up / Down
  const moveProductOrder = async (productId: string, direction: "up" | "down") => {
    const currentIndex = filtered.findIndex((p) => p._id === productId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= filtered.length) return;

    const currentItem = filtered[currentIndex];
    const targetItem = filtered[targetIndex];

    const currentSort = currentItem.sortOrder ?? currentIndex + 1;
    const targetSort = targetItem.sortOrder ?? targetIndex + 1;

    let newCurrentSort = targetSort;
    let newTargetSort = currentSort;
    if (newCurrentSort === newTargetSort) {
      newCurrentSort = direction === "up" ? Math.max(1, targetSort - 1) : targetSort + 1;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p._id === currentItem._id) return { ...p, sortOrder: newCurrentSort };
        if (p._id === targetItem._id) return { ...p, sortOrder: newTargetSort };
        return p;
      })
    );

    const token = localStorage.getItem("token");
    try {
      await Promise.all([
        fetch(`/api/admin/products/${currentItem._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sortOrder: newCurrentSort }),
        }),
        fetch(`/api/admin/products/${targetItem._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sortOrder: newTargetSort }),
        }),
      ]);
      toast.success("Posisi urutan produk berhasil diubah!");
      fetchProducts();
    } catch {
      toast.error("Gagal mengubah urutan");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      const all = new Set<string>();
      filtered.forEach((p) => all.add(p._id));
      setSelectedIds(all);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleApplyBulkCategory = async () => {
    if (!bulkCategoryName.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }
    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "updateCategory",
          productIds: Array.from(selectedIds),
          category: bulkCategoryName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setBulkCategoryModalOpen(false);
        setBulkCategoryName("");
        setSelectedIds(new Set());
        fetchProducts();
      } else {
        toast.error(data.error || "Gagal mengubah kategori");
      }
    } catch {
      toast.error("Gagal memproses aksi masal");
    }
    setBulkActionLoading(false);
  };

  const handleBulkToggleActive = async (isActive: boolean) => {
    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "toggleActive",
          productIds: Array.from(selectedIds),
          isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSelectedIds(new Set());
        fetchProducts();
      } else {
        toast.error(data.error || "Gagal mengubah status");
      }
    } catch {
      toast.error("Gagal memproses aksi masal");
    }
    setBulkActionLoading(false);
  };

  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "delete",
          productIds: Array.from(selectedIds),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setBulkDeleteConfirmOpen(false);
        setSelectedIds(new Set());
        fetchProducts();
      } else {
        toast.error(data.error || "Gagal menghapus produk");
      }
    } catch {
      toast.error("Gagal memproses aksi masal");
    }
    setBulkActionLoading(false);
  };

  const editGameId = editProduct?.gameId?._id || editProduct?.gameId;
  const editGameCategories = useMemo(() => {
    if (!editGameId) return [];
    const set = new Set<string>();
    products.forEach((p) => {
      const gId = p.gameId?._id || p.gameId;
      if (gId === editGameId && p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [editGameId, products]);

  const toggleActive = async (productId: string, current: boolean) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !current }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Produk ${!current ? "diaktifkan" : "dinonaktifkan"}`);
      fetchProducts();
    } else {
      toast.error("Gagal mengubah status");
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/products/${deleteProduct._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Produk berhasil dihapus");
      fetchProducts();
    } else {
      toast.error("Gagal menghapus produk");
    }
    setDeleteProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Data Produk</h1>
          <p className="text-gray-400 text-sm mt-1">Kelola {filtered.length} produk top-up, atur urutan manual atau otomatis, dan sinkronkan harga.</p>
        </div>
        
        {/* Header Action Toolbar */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          {/* Sync Digiflazz Button */}
          <button
            type="button"
            onClick={handleSyncDigiflazz}
            disabled={syncingDigi}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 text-emerald-300 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:scale-105 cursor-pointer"
            title="Sinkronkan status produk dan harga modal live langsung dari Digiflazz API"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${syncingDigi ? "animate-spin" : ""}`} />
            {syncingDigi ? "Sinkronisasi..." : "Sync Digiflazz"}
          </button>

          {/* Auto Import Button */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-cyan-300 border border-blue-500/30 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:scale-105 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            Auto Import
          </button>

          {/* Manual Add Product */}
          <Link href="/admin/products/new">
            <button className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-500/25 hover:scale-105 cursor-pointer">
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>
          </Link>
        </div>
      </div>

      {/* Filters & Auto-Sort Bar */}
      <div className="bg-gaming-card rounded-2xl border border-white/5 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk atau SKU Digiflazz..."
              className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Game Filter */}
          <div className="relative min-w-[220px]">
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 appearance-none cursor-pointer font-medium"
            >
              <option value="ALL">Semua Game ({games.length} Game)</option>
              {games.map((g) => (
                <option key={g._id || g.id} value={g._id || g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Auto-Sort Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Auto-Urutkan {gameFilter === "ALL" ? "Semua Game" : selectedGameForImport?.name || "Game Ini"}:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleAutoSort("price_asc")}
              disabled={sortingLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer shadow-sm"
              title="Urutkan dari harga termurah ke termahal"
            >
              <ArrowDownUp className={`w-3.5 h-3.5 ${sortingLoading ? "animate-spin" : ""}`} />
              <span>⚡ Termurah ➔ Termahal</span>
            </button>
            <button
              type="button"
              onClick={() => handleAutoSort("nominal_asc")}
              disabled={sortingLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
              title="Urutkan dari nominal angka terkecil ke terbesar"
            >
              💎 Nominal Angka
            </button>
            <button
              type="button"
              onClick={() => handleAutoSort("name_asc")}
              disabled={sortingLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              title="Urutkan alfabet A-Z"
            >
              🔤 Nama A - Z
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (tampil ketika 1 atau lebih produk dicentang) */}
      {selectedIds.size > 0 && (
        <div className="bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-slate-900/90 border border-purple-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl shadow-purple-500/20 backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
              <span>📦</span>
              <span>{selectedIds.size} Produk Dipilih</span>
            </span>
            <span className="text-gray-300 text-xs font-medium hidden sm:inline">Aksi masal untuk produk yang dicentang:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkCategoryModalOpen(true)}
              className="flex items-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer"
            >
              <span>🏷️</span>
              <span>Ubah Kategori</span>
            </button>
            <button
              type="button"
              onClick={() => handleBulkToggleActive(true)}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer"
            >
              <span>🟢</span>
              <span>Aktifkan</span>
            </button>
            <button
              type="button"
              onClick={() => handleBulkToggleActive(false)}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer"
            >
              <span>🔴</span>
              <span>Nonaktifkan</span>
            </button>
            <button
              type="button"
              onClick={() => setBulkDeleteConfirmOpen(true)}
              disabled={bulkActionLoading}
              className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer"
            >
              <span>🗑️</span>
              <span>Hapus ({selectedIds.size})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 underline font-medium ml-1 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/30 border-b border-white/5">
                <th className="w-10 px-4 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    title="Pilih Semua Produk"
                  />
                </th>
                <th className="text-gray-400 text-xs font-bold uppercase tracking-wider px-3 py-4 text-center w-12">#</th>
                <th className="text-purple-300 text-xs font-bold uppercase tracking-wider px-4 py-4 text-center w-28 whitespace-nowrap">
                  Urutan 🔢
                </th>
                <th className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap">Produk</th>
                <th className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap">Game</th>
                <th className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap">SKU Digiflazz</th>
                <th className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap">Harga Modal</th>
                <th className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap">Harga Jual</th>
                <th className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap">Margin</th>
                <th className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap text-center">Status</th>
                <th className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center text-gray-500 text-sm">
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((p, pIndex) => {
                  const margin = p.sellingPrice - p.price;
                  const marginPct = p.price > 0 ? ((margin / p.price) * 100).toFixed(0) : "0";
                  const isChecked = selectedIds.has(p._id);

                  return (
                    <tr
                      key={p._id}
                      className={`transition-colors group ${
                        isChecked ? "bg-purple-500/10" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(p._id)}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>

                      {/* Rank Index */}
                      <td className="px-3 py-4 text-center">
                        <span className="text-gray-500 font-mono text-xs font-bold">
                          #{pIndex + 1}
                        </span>
                      </td>

                      {/* Interactive Sort Order Column */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex items-center bg-black/40 border border-purple-500/30 px-2 py-1 rounded-lg focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/50 shadow-inner">
                            <input
                              type="number"
                              value={p.sortOrder ?? (pIndex + 1)}
                              onChange={(e) =>
                                updateProductSortOrder(p._id, parseInt(e.target.value) || 0)
                              }
                              className="w-12 bg-transparent text-white font-mono font-bold text-xs text-center focus:outline-none"
                              title="Ketik angka urutan tampil nominal produk"
                            />
                          </div>

                          {/* Quick Up / Down shift buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveProductOrder(p._id, "up")}
                              disabled={pIndex === 0}
                              className={`p-0.5 rounded text-gray-400 hover:text-white hover:bg-white/10 ${
                                pIndex === 0 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                              }`}
                              title="Pindahkan naik satu posisi"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveProductOrder(p._id, "down")}
                              disabled={pIndex === filtered.length - 1}
                              className={`p-0.5 rounded text-gray-400 hover:text-white hover:bg-white/10 ${
                                pIndex === filtered.length - 1
                                  ? "opacity-30 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                              title="Pindahkan turun satu posisi"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Product Name & Category */}
                      <td className="px-6 py-4">
                        <div className="text-white text-sm font-bold group-hover:text-cyan-400 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5 flex items-center gap-1 font-medium">
                          <span>🏷️</span>
                          <span>{p.category}</span>
                        </div>
                      </td>

                      {/* Game Name */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 text-gray-300 text-xs font-semibold border border-white/10">
                          {p.gameId?.name || "—"}
                        </span>
                      </td>

                      {/* Digiflazz SKU */}
                      <td className="px-6 py-4">
                        <span className="text-gray-400 font-mono text-xs bg-black/30 px-2.5 py-1 rounded-md border border-white/5">
                          {p.digiflazzSku}
                        </span>
                      </td>

                      {/* Capital Price */}
                      <td className="px-6 py-4 text-gray-400 text-sm font-medium">
                        {formatCurrency(p.price)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-6 py-4 text-white text-sm font-black tracking-tight">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      {/* Margin */}
                      <td className="px-6 py-4">
                        <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20 whitespace-nowrap">
                          +{formatCurrency(margin)} ({marginPct}%)
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant={p.isActive ? "success" : "default"}
                          className="text-[10px] uppercase tracking-wider px-2.5 py-0.5"
                        >
                          {p.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="p-2 rounded-lg transition-all border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                            title="Edit Produk"
                          >
                            <Pencil className="w-4 h-4 text-purple-400" />
                          </button>
                          <button
                            onClick={() => toggleActive(p._id, p.isActive)}
                            className={`p-2 rounded-lg transition-all border cursor-pointer ${
                              p.isActive
                                ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                                : "border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20"
                            }`}
                            title={p.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {p.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteProduct(p)}
                            className="p-2 rounded-lg transition-all border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Produk">
        {editProduct && (
          <EditProductModal
            product={editProduct}
            gameCategories={editGameCategories}
            onClose={() => setEditProduct(null)}
            onSaved={fetchProducts}
          />
        )}
      </Modal>

      {/* Delete Product Confirmation Modal */}
      <Modal open={!!deleteProduct} onClose={() => setDeleteProduct(null)} title="Konfirmasi Hapus" size="sm">
        {deleteProduct && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Yakin ingin menghapus produk <span className="text-white font-semibold">{deleteProduct.name}</span>?
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteProduct(null)}>Batal</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete}>Hapus</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Set Kategori Masal */}
      <Modal open={bulkCategoryModalOpen} onClose={() => setBulkCategoryModalOpen(false)} title="Ubah Kategori Produk Masal">
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3.5 flex items-center gap-3">
            <span className="text-2xl">🏷️</span>
            <div>
              <p className="text-white font-bold text-sm">Mengubah Kategori {selectedIds.size} Produk Sekaligus</p>
              <p className="text-gray-400 text-xs mt-0.5">Seluruh produk yang dicentang akan diperbarui kategorinya secara bersamaan.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Kategori Baru *</label>
            <Input
              value={bulkCategoryName}
              onChange={(e) => setBulkCategoryName(e.target.value)}
              placeholder="Contoh: Bulanan, Pass, Top Up, Voucher, etc."
              autoFocus
            />
            
            {/* Quick chips */}
            <div className="mt-3 space-y-1.5">
              <span className="text-[11px] text-gray-400 font-medium">Pilihan Kategori Populer / Cepat:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {["Bulanan", "Pass", "Membership", "Top Up", "Voucher", "Starlight", "Welkin", "Weekly"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setBulkCategoryName(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-semibold flex items-center gap-1 ${
                      bulkCategoryName.toLowerCase() === cat.toLowerCase()
                        ? "bg-purple-500 text-white border-purple-400 shadow-sm"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <span>🏷️</span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setBulkCategoryModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" className="flex-1" loading={bulkActionLoading} onClick={handleApplyBulkCategory}>
              Terapkan ke {selectedIds.size} Produk
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Hapus Masal */}
      <Modal open={bulkDeleteConfirmOpen} onClose={() => setBulkDeleteConfirmOpen(false)} title="Konfirmasi Hapus Masal" size="sm">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Yakin ingin menghapus <span className="text-white font-bold">{selectedIds.size} produk</span> yang Anda centang secara permanen?
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setBulkDeleteConfirmOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" className="flex-1" loading={bulkActionLoading} onClick={handleBulkDelete}>
              Ya, Hapus {selectedIds.size} Produk
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Products Modal */}
      <ImportProductsModal
        open={showImportModal}
        preselectedGame={selectedGameForImport}
        onClose={() => setShowImportModal(false)}
        onImported={fetchProducts}
      />
    </div>
  );
}
