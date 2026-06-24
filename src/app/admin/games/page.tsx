"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Package, ToggleLeft, ToggleRight, Download, Zap, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import ImportProductsModal from "@/components/admin/ImportProductsModal";
import ImportGameModal from "@/components/admin/ImportGameModal";

const CATEGORIES = ["Mobile", "PC", "Console", "Battle Royale", "MOBA", "RPG", "Lainnya"];
const STATUS_CATEGORIES = ["Lagi Populer", "Baru Rilis", "Voucher", "Top Up Langsung", "Top Up Login", "Pulsa", "Entertainment"];

interface Game { _id: string; name: string; slug: string; description?: string; imageUrl?: string; category: string; statusCategory?: string; isActive: boolean; sortOrder: number; isCheckAccountSupported: boolean; targetInputs?: any[]; products?: Product[]; }
interface Product { _id: string; name: string; description?: string; price: number; sellingPrice: number; digiflazzSku: string; category: string; isActive: boolean; sortOrder: number; }

// ── Edit Game Modal ──────────────────────────────────────────────────────────
function EditGameModal({ game, onClose, onSaved }: { game: Game; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ 
    name: game.name || "", 
    slug: game.slug || "", 
    description: game.description || "", 
    imageUrl: game.imageUrl || "", 
    category: game.category || CATEGORIES[0], 
    statusCategory: game.statusCategory || "",
    sortOrder: game.sortOrder || 0,
    isCheckAccountSupported: game.isCheckAccountSupported || false,
    targetInputs: game.targetInputs || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, imageUrl: data.url }));
        toast.success("Gambar berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah gambar");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    const isNew = !game._id;
    const res = await fetch(isNew ? "/api/games" : `/api/admin/games/${game._id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) { toast.success(`Game berhasil ${isNew ? "ditambahkan" : "diupdate"}`); onSaved(); onClose(); }
    else toast.error(data.error || "Gagal menyimpan");
    setSaving(false);
  };

  const addTargetInput = () => {
    setForm({ ...form, targetInputs: [...form.targetInputs, { name: "", type: "text" }] });
  };

  const removeTargetInput = (index: number) => {
    const newInputs = [...form.targetInputs];
    newInputs.splice(index, 1);
    setForm({ ...form, targetInputs: newInputs });
  };

  const updateTargetInput = (index: number, field: string, value: string) => {
    const newInputs = [...form.targetInputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setForm({ ...form, targetInputs: newInputs });
  };

  return (
    <div className="space-y-4">
      <Input label="Nama Game" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} />
      <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Kategori</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Status Kategori (Tampil di Home)</label>
        <select value={form.statusCategory} onChange={(e) => setForm({ ...form, statusCategory: e.target.value })} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
          <option value="">Tanpa Status Kategori (Tidak Tampil di Home)</option>
          {STATUS_CATEGORIES.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">URL Gambar</label>
        <div className="flex gap-2 items-center">
          <Input 
            value={form.imageUrl} 
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} 
            placeholder="https://... atau jalur lokal" 
          />
          <label className={`flex items-center justify-center gap-1.5 px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex-shrink-0 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="w-4 h-4" />
            {uploading ? "Unggah..." : "Unggah"}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </div>
      <Input label="Urutan Tampil" type="number" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
      
      {/* Target Inputs */}
      <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white block">Custom Data Target (Opsional)</label>
            <p className="text-xs text-gray-400 mt-0.5">Biarkan kosong untuk menggunakan standar User ID & Server ID.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={addTargetInput}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {form.targetInputs.map((input, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input 
              placeholder="Contoh: Email Joki" 
              value={input.name} 
              onChange={(e) => updateTargetInput(idx, "name", e.target.value)} 
            />
            <select 
              value={input.type} 
              onChange={(e) => updateTargetInput(idx, "type", e.target.value)} 
              className="bg-gaming-accent border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm w-32"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="password">Password</option>
              <option value="number">Number</option>
            </select>
            <button 
              onClick={() => removeTargetInput(idx)} 
              className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-gaming-accent/50 border border-white/10 p-4 rounded-xl">
        <div>
          <label className="text-sm font-medium text-white block">Support Cek Akun</label>
          <p className="text-xs text-gray-400 mt-0.5">Aktifkan untuk memunculkan tombol Cek Akun (Validasi ID) saat top up.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, isCheckAccountSupported: !form.isCheckAccountSupported })}
          className={`flex-shrink-0 transition-colors ${form.isCheckAccountSupported ? "text-green-400 hover:text-green-300" : "text-gray-500 hover:text-gray-400"}`}
        >
          {form.isCheckAccountSupported ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
        <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Simpan</Button>
      </div>
    </div>
  );
}

// ── Edit Product Modal ───────────────────────────────────────────────────────
function EditProductModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: product.name, description: product.description || "", price: product.price, sellingPrice: product.sellingPrice, digiflazzSku: product.digiflazzSku, category: product.category, sortOrder: product.sortOrder });
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
    if (data.success) { toast.success("Produk berhasil diupdate"); onSaved(); onClose(); }
    else toast.error(data.error || "Gagal menyimpan");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Input label="Nama Produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Harga Modal (Rp)" type="number" value={String(form.price)} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
        <Input label="Harga Jual (Rp)" type="number" value={String(form.sellingPrice)} onChange={(e) => setForm({ ...form, sellingPrice: parseInt(e.target.value) || 0 })} />
      </div>
      {/* Margin preview */}
      <div className={`rounded-lg px-4 py-2.5 text-sm ${margin >= 0 ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
        Margin: {formatCurrency(margin)} ({marginPct}%)
      </div>
      <Input label="SKU Digiflazz" value={form.digiflazzSku} onChange={(e) => setForm({ ...form, digiflazzSku: e.target.value })} />
      <Input label="Kategori" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Diamond, UC, VP, dll" />
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

// ── Add Product Modal ────────────────────────────────────────────────────────
function AddProductModal({ gameId, onClose, onSaved }: { gameId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", price: "", sellingPrice: "", digiflazzSku: "", category: "", sortOrder: "0" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.price || !form.sellingPrice || !form.digiflazzSku || !form.category) {
      toast.error("Lengkapi semua field wajib"); return;
    }
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, gameId, price: parseInt(form.price), sellingPrice: parseInt(form.sellingPrice), sortOrder: parseInt(form.sortOrder) }),
    });
    const data = await res.json();
    if (data.success) { toast.success("Produk berhasil ditambahkan"); onSaved(); onClose(); }
    else toast.error(data.error || "Gagal menambahkan");
    setSaving(false);
  };

  const margin = parseInt(form.sellingPrice || "0") - parseInt(form.price || "0");

  return (
    <div className="space-y-4">
      <Input label="Nama Produk *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="86 Diamond" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Harga Modal (Rp) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="15000" />
        <Input label="Harga Jual (Rp) *" type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="17000" />
      </div>
      {form.price && form.sellingPrice && (
        <div className={`rounded-lg px-4 py-2 text-sm ${margin >= 0 ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
          Margin: {formatCurrency(margin)}
        </div>
      )}
      <Input label="SKU Digiflazz *" value={form.digiflazzSku} onChange={(e) => setForm({ ...form, digiflazzSku: e.target.value })} placeholder="mlbb-86" />
      <Input label="Kategori *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Diamond" />
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm" />
      </div>
      <Input label="Urutan Tampil" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
        <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Tambah Produk</Button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [productsByGame, setProductsByGame] = useState<Record<string, Product[]>>({});
  const [loadingProducts, setLoadingProducts] = useState<string | null>(null);

  // Modals
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addProductGameId, setAddProductGameId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "game" | "product"; id: string; name: string } | null>(null);
  const [importGame, setImportGame] = useState<Game | null | undefined>(undefined);
  const [showImportGameModal, setShowImportGameModal] = useState(false);

  const fetchGames = async () => {
    setLoading(true);
    // Pakai endpoint admin agar semua game tampil (termasuk nonaktif)
    const token = localStorage.getItem("token");
    const res = await fetch("/api/games?admin=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setGames(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchGames(); }, [refreshKey]);

  const loadProducts = async (gameId: string) => {
    if (productsByGame[gameId]) return; // already loaded
    setLoadingProducts(gameId);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/products?gameId=${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setProductsByGame((prev) => ({ ...prev, [gameId]: data.data }));
    }
    setLoadingProducts(null);
  };

  const toggleExpand = (gameId: string) => {
    if (expandedId === gameId) {
      setExpandedId(null);
    } else {
      setExpandedId(gameId);
      loadProducts(gameId);
    }
  };

  const refreshProducts = (gameId: string) => {
    setProductsByGame((prev) => { const n = { ...prev }; delete n[gameId]; return n; });
    loadProducts(gameId);
  };

  const toggleGameActive = async (game: Game) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/games/${game._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !game.isActive }),
    });
    const data = await res.json();
    if (data.success) { toast.success(`Game ${!game.isActive ? "diaktifkan" : "dinonaktifkan"}`); fetchGames(); }
    else toast.error("Gagal mengubah status");
  };

  const toggleProductActive = async (product: Product, gameId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    const data = await res.json();
    if (data.success) { toast.success(`Produk ${!product.isActive ? "diaktifkan" : "dinonaktifkan"}`); refreshProducts(gameId); }
    else toast.error("Gagal mengubah status");
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
        const token = localStorage.getItem("token");
    const url = deleteConfirm.type === "game"
      ? `/api/admin/games/${deleteConfirm.id}`
      : `/api/admin/products/${deleteConfirm.id}`;
    const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      toast.success(`${deleteConfirm.type === "game" ? "Game" : "Produk"} berhasil dihapus`);
      if (deleteConfirm.type === "game") fetchGames();
      else {
        const gameId = games.find((g) => productsByGame[g._id]?.some((p) => p._id === deleteConfirm.id))?._id;
        if (gameId) refreshProducts(gameId);
      }
    } else toast.error("Gagal menghapus");
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Data Game</h1>
          <p className="text-gray-400 text-sm mt-1">Kelola {games.length} game yang tersedia di website Anda.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <button
            onClick={() => setShowImportGameModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-cyan-300 border border-blue-500/30 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:scale-105"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            Auto-Import
          </button>
          <button 
            onClick={() => setEditGame({} as Game)}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/25 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Game Manual
          </button>
        </div>
      </div>

      {/* Game List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gaming-card rounded-xl border border-white/5 p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="bg-gaming-card rounded-xl border border-white/5 p-12 text-center text-gray-500">
          Belum ada game. Tambahkan game pertama!
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => {
            const isExpanded = expandedId === game._id;
            const products = productsByGame[game._id] || [];

            return (
              <div key={game._id} className="bg-gaming-card rounded-xl border border-white/5 overflow-hidden">
                {/* Game Row */}
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{game.name.charAt(0)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{game.name}</span>
                      <Badge variant={game.isActive ? "success" : "default"} className="text-xs">
                        {game.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-gray-500 text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/5">{game.category}</span>
                      <span className="text-gray-700 text-xs">•</span>
                      <span className="text-gray-400 text-xs font-mono bg-black/20 px-2 py-0.5 rounded-md">/{game.slug}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setEditGame(game)} title="Edit game" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleGameActive(game)}
                      title={game.isActive ? "Nonaktifkan" : "Aktifkan"}
                      className={`p-2 rounded-lg transition-all ${game.isActive ? "text-yellow-400 hover:bg-yellow-500/10" : "text-green-400 hover:bg-green-500/10"}`}
                    >
                      {game.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: "game", id: game._id, name: game.name })}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      title="Hapus game"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {/* Divider */}
                    <div className="w-px h-6 bg-white/10 mx-1"></div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(game._id)}
                      className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/5"
                    >
                      <Package className="w-4 h-4" />
                      Produk
                      {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </button>
                    {/* Import dari Digiflazz */}
                    <button
                      onClick={() => setImportGame(game)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 text-white border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      Import
                    </button>
                  </div>
                </div>

                {/* Products Panel */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/40 backdrop-blur-sm p-2 rounded-b-2xl">
                    {/* Products header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/5 mb-2">
                      <span className="text-gray-300 text-sm font-bold">
                        {loadingProducts === game._id ? "Memuat produk..." : `${products.length} Produk Tersedia`}
                      </span>
                      <button onClick={() => setAddProductGameId(game._id)} className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-purple-500/20">
                        <Plus className="w-3.5 h-3.5" /> Tambah Produk
                      </button>
                    </div>

                    {loadingProducts === game._id ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm bg-black/20 rounded-xl border border-white/5">
                        Belum ada produk untuk game ini
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {products.map((product) => {
                          const margin = product.sellingPrice - product.price;
                          return (
                            <div key={product._id} className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.06] rounded-xl border border-white/5 transition-all group">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-bold group-hover:text-cyan-400 transition-colors">{product.name}</span>
                                  <Badge variant={product.isActive ? "success" : "default"} className="text-[10px] uppercase tracking-wider px-2 py-0.5">
                                    {product.isActive ? "Aktif" : "Off"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-gray-400 text-xs font-mono bg-black/20 px-2 py-0.5 rounded-md border border-white/5">{product.digiflazzSku}</span>
                                  <span className="text-gray-500 text-xs">{product.category}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                                <div className="text-white text-sm font-black">{formatCurrency(product.sellingPrice)}</div>
                                <div className="text-green-400 text-xs font-medium">Margin: +{formatCurrency(margin)}</div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 pl-2 border-l border-white/5">
                                <button onClick={() => setEditProduct(product)} title="Edit produk" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleProductActive(product, game._id)}
                                  className={product.isActive ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}
                                >
                                  {product.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                </button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ type: "product", id: product._id, name: product.name })}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Game Modal */}
      <Modal open={!!editGame} onClose={() => setEditGame(null)} title="Edit Game">
        {editGame && <EditGameModal game={editGame} onClose={() => setEditGame(null)} onSaved={fetchGames} />}
      </Modal>

      {/* Edit Product Modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Produk">
        {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSaved={() => {
          const gameId = games.find((g) => productsByGame[g._id]?.some((p) => p._id === editProduct._id))?._id;
          if (gameId) refreshProducts(gameId);
        }} />}
      </Modal>

      {/* Add Product Modal */}
      <Modal open={!!addProductGameId} onClose={() => setAddProductGameId(null)} title="Tambah Produk">
        {addProductGameId && <AddProductModal gameId={addProductGameId} onClose={() => setAddProductGameId(null)} onSaved={() => refreshProducts(addProductGameId)} />}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus" size="sm">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Yakin ingin menghapus <span className="text-white font-semibold">{deleteConfirm.name}</span>?
              {deleteConfirm.type === "game" && <span className="block text-red-400 text-xs mt-1">Semua produk dalam game ini juga akan terhapus.</span>}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>Batal</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete}>Hapus</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Import Produk dari Digiflazz */}
      <ImportProductsModal
        open={importGame !== undefined}
        onClose={() => setImportGame(undefined)}
        onImported={() => {
          if (importGame) refreshProducts(importGame._id);
          setImportGame(undefined);
          setRefreshKey((k) => k + 1);
        }}
        preselectedGame={importGame || undefined}
      />

      {/* Tambah Game dari Digiflazz */}
      <ImportGameModal
        open={showImportGameModal}
        onClose={() => setShowImportGameModal(false)}
        onImported={() => {
          setShowImportGameModal(false);
          setRefreshKey((k) => k + 1); // trigger re-fetch
        }}
      />
    </div>
  );
}
