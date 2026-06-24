"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, ToggleLeft, ToggleRight, Sparkles, Image as ImageIcon, Percent, Clock, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

const GRADIENT_PRESETS = [
  { name: "Blue Indigo Sunset", value: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 50%, #ec4899 100%)" },
  { name: "AoT Amber Bronze", value: "linear-gradient(135deg, #1e1b18 0%, #3a322c 50%, #201712 100%)" },
  { name: "Affiliate Dark Purple", value: "linear-gradient(135deg, #2e1065 0%, #1e1b4b 50%, #030712 100%)" },
  { name: "Flash Sale Yellow Indigo", value: "linear-gradient(135deg, #78350f 0%, #facc15 50%, #1e1b4b 100%)" },
];

const TEXT_COLOR_PRESETS = [
  { name: "Amber", value: "text-amber-400" },
  { name: "Cyan/Blue", value: "text-cyan-400" },
  { name: "Yellow", value: "text-yellow-300" },
  { name: "White", value: "text-white" },
  { name: "Pink/Rose", value: "text-rose-400" },
];

export default function MarketingAdminPage() {
  const [activeTab, setActiveTab] = useState<"banners" | "flashSales">("banners");
  const [banners, setBanners] = useState<any[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [flashSaleModalOpen, setFlashSaleModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [editingFlashSale, setEditingFlashSale] = useState<any | null>(null);

  // Forms state
  const [bannerForm, setBannerForm] = useState({
    bannerType: "text",
    title: "",
    subtitle: "",
    badge: "Promo",
    discount: "",
    description: "",
    bgGradient: GRADIENT_PRESETS[0].value,
    textColor: TEXT_COLOR_PRESETS[0].value,
    imageUrl: "",
    linkUrl: "",
    isActive: true,
    sortOrder: 0,
  });

  const [flashSaleForm, setFlashSaleForm] = useState({
    selectedGameId: "",
    productId: "",
    discountPrice: 0,
    stockTotal: 100,
    stockLeft: 100,
    endTime: "",
    isActive: true,
  });

  const [bannerUploading, setBannerUploading] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerUploading(true);
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
        setBannerForm((prev) => ({ ...prev, imageUrl: data.url }));
        toast.success("Gambar banner berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah gambar banner");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengunggah gambar banner");
    } finally {
      setBannerUploading(false);
    }
  };

  const fetchBanners = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/banners?admin=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setBanners(data.data);
    setLoading(false);
  };

  const fetchFlashSales = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/flash-sales?admin=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setFlashSales(data.data);
    setLoading(false);
  };

  const fetchGames = async () => {
    const res = await fetch("/api/games");
    const data = await res.json();
    if (data.success) setGames(data.data);
  };

  useEffect(() => {
    fetchGames();
    if (activeTab === "banners") fetchBanners();
    else fetchFlashSales();
  }, [activeTab]);

  // ── BANNER CRUD ──────────────────────────────────────────────────────────
  const openBannerModal = (banner: any = null) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        bannerType: banner.bannerType || "text",
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        badge: banner.badge || "Promo",
        discount: banner.discount || "",
        description: banner.description || "",
        bgGradient: banner.bgGradient || GRADIENT_PRESETS[0].value,
        textColor: banner.textColor || TEXT_COLOR_PRESETS[0].value,
        imageUrl: banner.imageUrl || "",
        linkUrl: banner.linkUrl || "",
        isActive: banner.isActive,
        sortOrder: banner.sortOrder,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        bannerType: "text",
        title: "",
        subtitle: "",
        badge: "Promo",
        discount: "",
        description: "",
        bgGradient: GRADIENT_PRESETS[0].value,
        textColor: TEXT_COLOR_PRESETS[0].value,
        imageUrl: "",
        linkUrl: "",
        isActive: true,
        sortOrder: banners.length,
      });
    }
    setBannerModalOpen(true);
  };

  const saveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const url = editingBanner ? `/api/banners/${editingBanner._id}` : "/api/banners";
    const method = editingBanner ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(bannerForm),
    });
    const data = await res.json();

    if (data.success) {
      toast.success(editingBanner ? "Banner berhasil diperbarui" : "Banner baru berhasil ditambahkan");
      setBannerModalOpen(false);
      fetchBanners();
    } else {
      toast.error(data.error || "Gagal menyimpan banner");
    }
  };

  const toggleBannerActive = async (banner: any) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/banners/${banner._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...banner, isActive: !banner.isActive }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Banner ${!banner.isActive ? "diaktifkan" : "dinonaktifkan"}`);
      fetchBanners();
    } else {
      toast.error("Gagal memperbarui status banner");
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/banners/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Banner berhasil dihapus");
      fetchBanners();
    } else {
      toast.error(data.error || "Gagal menghapus banner");
    }
  };

  // ── FLASH SALE CRUD ────────────────────────────────────────────────────────
  const openFlashSaleModal = (sale: any = null) => {
    if (sale) {
      setEditingFlashSale(sale);
      
      // Find game ID from game slug
      const associatedGame = games.find(g => g.slug === sale.gameSlug);
      
      setFlashSaleForm({
        selectedGameId: associatedGame?._id || associatedGame?.id || "",
        productId: sale.productId,
        discountPrice: sale.discountPrice,
        stockTotal: sale.stockTotal,
        stockLeft: sale.stockLeft,
        endTime: new Date(sale.endTime).toISOString().slice(0, 16),
        isActive: sale.isActive,
      });
    } else {
      setEditingFlashSale(null);
      setFlashSaleForm({
        selectedGameId: "",
        productId: "",
        discountPrice: 0,
        stockTotal: 50,
        stockLeft: 50,
        endTime: "",
        isActive: true,
      });
    }
    setFlashSaleModalOpen(true);
  };

  const saveFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const url = editingFlashSale ? `/api/flash-sales/${editingFlashSale.id}` : "/api/flash-sales";
    const method = editingFlashSale ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(flashSaleForm),
    });
    const data = await res.json();

    if (data.success) {
      toast.success(editingFlashSale ? "Flash sale berhasil diperbarui" : "Flash sale baru berhasil ditambahkan");
      setFlashSaleModalOpen(false);
      fetchFlashSales();
    } else {
      toast.error(data.error || "Gagal menyimpan flash sale");
    }
  };

  const toggleFlashSaleActive = async (sale: any) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/flash-sales/${sale.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !sale.isActive }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Promo ${!sale.isActive ? "diaktifkan" : "dinonaktifkan"}`);
      fetchFlashSales();
    } else {
      toast.error("Gagal memperbarui status flash sale");
    }
  };

  const deleteFlashSale = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghentikan promo flash sale ini?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/flash-sales/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Promo flash sale dihentikan");
      fetchFlashSales();
    } else {
      toast.error(data.error || "Gagal menghapus promo");
    }
  };

  // Find products of selected game in FlashSale form
  const selectedGame = games.find(g => (g._id || g.id) === flashSaleForm.selectedGameId);
  const productsList = selectedGame?.products || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Pemasaran & Promosi</h1>
          <p className="text-gray-400 text-sm mt-1">Konfigurasi dynamic banner sliders dan flash sale kilat.</p>
        </div>
        
        <button
          onClick={() => activeTab === "banners" ? openBannerModal() : openFlashSaleModal()}
          className="relative z-10 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "banners" ? "Tambah Banner" : "Tambah Flash Sale"}
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setActiveTab("banners")}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 px-1 ${
            activeTab === "banners" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Banner Slider
        </button>
        <button
          onClick={() => setActiveTab("flashSales")}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 px-1 ${
            activeTab === "flashSales" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Percent className="w-4 h-4" />
          Flash Sale
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        {activeTab === "banners" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 border-b border-white/5">
                  {["Badge & Diskon", "Judul", "Gradien & Warna", "Urutan", "Status", "Aksi"].map((h) => (
                    <th key={h} className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : banners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500 text-sm">Tidak ada banner promosi terpasang</td>
                  </tr>
                ) : (
                  banners.map((b) => (
                    <tr key={b._id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {b.bannerType === "image" ? (
                          <span className="text-xs text-gray-500">N/A (Banner Gambar)</span>
                        ) : (
                          <>
                            <span className="inline-block px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-bold mr-2">{b.badge}</span>
                            <span className="text-white font-black italic">{b.discount}</span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {b.bannerType === "image" ? (
                          <div className="text-white text-sm font-bold truncate max-w-[200px]">Banner Gambar</div>
                        ) : (
                          <>
                            <div className="text-white text-sm font-bold truncate max-w-[200px]">{b.title}</div>
                            <div className="text-gray-400 text-xs truncate max-w-[200px] mt-0.5">{b.subtitle}</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {b.bannerType === "image" ? (
                          <div className="flex items-center gap-2">
                            {b.imageUrl && (
                              <img src={b.imageUrl} alt="Banner Preview" className="w-16 h-9 rounded object-cover border border-white/10" />
                            )}
                            <span className="text-xs text-gray-400 truncate max-w-[120px]">{b.imageUrl}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div style={{ background: b.bgGradient }} className="w-8 h-8 rounded-lg border border-white/10" title="Background gradient preview" />
                            <span className={`text-xs px-2 py-0.5 rounded bg-black/40 font-mono ${b.textColor}`}>{b.textColor}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-sm">{b.sortOrder}</td>
                      <td className="px-6 py-4">
                        <Badge variant={b.isActive ? "success" : "default"}>
                          {b.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleBannerActive(b)}
                            className={`p-2 rounded-lg border transition-all ${
                              b.isActive 
                                ? "border-yellow-500/20 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10" 
                                : "border-green-500/20 text-green-400 bg-green-500/5 hover:bg-green-500/10"
                            }`}
                            title={b.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {b.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openBannerModal(b)} className="p-2 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteBanner(b._id)} className="p-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 border-b border-white/5">
                  {["Game / Produk", "Harga Asli", "Harga Promo", "Kuota / Sisa", "Waktu Berakhir", "Status", "Aksi"].map((h) => (
                    <th key={h} className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : flashSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500 text-sm">Tidak ada produk dalam promo flash sale</td>
                  </tr>
                ) : (
                  flashSales.map((s) => {
                    const isExpired = new Date(s.endTime) < new Date();
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.03] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-white text-sm font-bold">{s.productName}</div>
                          <div className="text-xs text-blue-400 mt-0.5">{s.gameName}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm line-through">{formatCurrency(s.originalPrice)}</td>
                        <td className="px-6 py-4 text-white text-sm font-black">{formatCurrency(s.discountPrice)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 w-24">
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div style={{ width: `${Math.round((s.stockLeft / s.stockTotal) * 100)}%` }} className="bg-red-500 h-full rounded-full" />
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">{s.stockLeft} / {s.stockTotal} Tersisa</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className={isExpired ? "text-red-400" : ""}>{new Date(s.endTime).toLocaleString("id-ID")}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isExpired ? (
                            <Badge variant="danger">Berakhir</Badge>
                          ) : (
                            <Badge variant={s.isActive ? "success" : "default"}>
                              {s.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleFlashSaleActive(s)}
                              disabled={isExpired}
                              className={`p-2 rounded-lg border transition-all ${
                                s.isActive 
                                  ? "border-yellow-500/20 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10" 
                                  : "border-green-500/20 text-green-400 bg-green-500/5 hover:bg-green-500/10"
                              } disabled:opacity-30 disabled:cursor-not-allowed`}
                              title={s.isActive ? "Nonaktifkan" : "Aktifkan"}
                            >
                              {s.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button onClick={() => openFlashSaleModal(s)} className="p-2 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteFlashSale(s.id)} className="p-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors" title="Hapus">
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
        )}
      </div>

      {/* ── BANNER MODAL DIALOG ── */}
      <Modal open={bannerModalOpen} onClose={() => setBannerModalOpen(false)} title={editingBanner ? "Edit Banner Promo" : "Tambah Banner Promo"} size="md">
        <form onSubmit={saveBanner} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tipe Banner</label>
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setBannerForm({ ...bannerForm, bannerType: "text" })}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                  bannerForm.bannerType === "text"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Teks & Desain Gradien
              </button>
              <button
                type="button"
                onClick={() => setBannerForm({ ...bannerForm, bannerType: "image" })}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                  bannerForm.bannerType === "image"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Gambar Spanduk Penuh
              </button>
            </div>
          </div>

          {bannerForm.bannerType === "text" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Judul Banner" placeholder="Contoh: REXUS x Attack on Titan" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} required={bannerForm.bannerType === "text"} />
                <Input label="Sub-judul Banner" placeholder="Contoh: Mechanical Keyboard Series" value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} required={bannerForm.bannerType === "text"} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Lencana Badge" placeholder="Contoh: Special Promo" value={bannerForm.badge} onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })} required={bannerForm.bannerType === "text"} />
                <Input label="Label Diskon" placeholder="Contoh: UP TO 45%" value={bannerForm.discount} onChange={(e) => setBannerForm({ ...bannerForm, discount: e.target.value })} required={bannerForm.bannerType === "text"} />
              </div>
              <Input label="Deskripsi Singkat" placeholder="Keterangan promo menarik..." value={bannerForm.description} onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })} required={bannerForm.bannerType === "text"} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Gradien Background</label>
                  <select
                    value={bannerForm.bgGradient}
                    onChange={(e) => setBannerForm({ ...bannerForm, bgGradient: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {GRADIENT_PRESETS.map((p) => (
                      <option key={p.name} value={p.value}>{p.name}</option>
                    ))}
                    <option value="custom">Input Custom Gradient CSS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Warna Teks Sorot</label>
                  <select
                    value={bannerForm.textColor}
                    onChange={(e) => setBannerForm({ ...bannerForm, textColor: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TEXT_COLOR_PRESETS.map((c) => (
                      <option key={c.name} value={c.value}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {bannerForm.bgGradient === "custom" && (
                <Input label="Custom Gradient CSS Value" placeholder="linear-gradient(135deg, #hex 0%, #hex 100%)" value={bannerForm.bgGradient === "custom" ? "" : bannerForm.bgGradient} onChange={(e) => setBannerForm({ ...bannerForm, bgGradient: e.target.value })} required={bannerForm.bannerType === "text"} />
              )}
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Unggah Gambar Banner</label>
              <div className="flex gap-2 items-center">
                <Input 
                  value={bannerForm.imageUrl} 
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} 
                  placeholder="Masukkan URL atau pilih berkas lokal..." 
                  required={bannerForm.bannerType === "image"}
                />
                <label className={`flex items-center justify-center gap-1.5 px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex-shrink-0 ${bannerUploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="w-4 h-4" />
                  {bannerUploading ? "Unggah..." : "Upload"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleBannerUpload} 
                    className="hidden" 
                  />
                </label>
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">Rekomendasi rasio gambar: 16:9 atau lebar minimal 1000px.</p>
            </div>
          )}

          {/* Redirect Link URL */}
          <Input 
            label="Tautan URL / Redirect Link (Opsional)" 
            placeholder="Contoh: /games/mobile-legends atau link eksternal" 
            value={bannerForm.linkUrl} 
            onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} 
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Urutan Urut (Sort Order)" type="number" value={bannerForm.sortOrder} onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: parseInt(e.target.value) || 0 })} required />
            <div className="flex items-center gap-2 pt-8">
              <input type="checkbox" id="bannerActive" checked={bannerForm.isActive} onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })} className="rounded bg-black/30 border-white/10 text-blue-500 focus:ring-blue-500" />
              <label htmlFor="bannerActive" className="text-sm text-gray-300 font-medium cursor-pointer select-none">Aktifkan langsung</label>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full">Simpan Banner</Button>
          </div>
        </form>
      </Modal>

      {/* ── FLASH SALE MODAL DIALOG ── */}
      <Modal open={flashSaleModalOpen} onClose={() => setFlashSaleModalOpen(false)} title={editingFlashSale ? "Edit Promo Flash Sale" : "Tambah Promo Flash Sale"} size="md">
        <form onSubmit={saveFlashSale} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Pilih Game</label>
              <select
                value={flashSaleForm.selectedGameId}
                onChange={(e) => setFlashSaleForm({ ...flashSaleForm, selectedGameId: e.target.value, productId: "" })}
                disabled={!!editingFlashSale}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                required
              >
                <option value="">-- Pilih Game --</option>
                {games.map((g) => (
                  <option key={g._id || g.id} value={g._id || g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Pilih Item Nominal</label>
              <select
                value={flashSaleForm.productId}
                onChange={(e) => {
                  const prod = productsList.find((p: any) => p.id === e.target.value);
                  setFlashSaleForm({ 
                    ...flashSaleForm, 
                    productId: e.target.value,
                    discountPrice: prod ? Math.round(prod.sellingPrice * 0.9) : 0, 
                  });
                }}
                disabled={!flashSaleForm.selectedGameId || !!editingFlashSale}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                required
              >
                <option value="">-- Pilih Produk --</option>
                {productsList.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.sellingPrice)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Harga Diskon Promo (Rp)" type="number" value={flashSaleForm.discountPrice} onChange={(e) => setFlashSaleForm({ ...flashSaleForm, discountPrice: parseInt(e.target.value) || 0 })} required />
            <Input label="Kuota Stok Total" type="number" value={flashSaleForm.stockTotal} onChange={(e) => setFlashSaleForm({ ...flashSaleForm, stockTotal: parseInt(e.target.value) || 1, stockLeft: editingFlashSale ? flashSaleForm.stockLeft : parseInt(e.target.value) })} required />
            <Input label="Stok Tersisa Saat Ini" type="number" value={flashSaleForm.stockLeft} onChange={(e) => setFlashSaleForm({ ...flashSaleForm, stockLeft: parseInt(e.target.value) || 0 })} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Waktu Selesai Promo</label>
              <input
                type="datetime-local"
                value={flashSaleForm.endTime}
                onChange={(e) => setFlashSaleForm({ ...flashSaleForm, endTime: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input type="checkbox" id="saleActive" checked={flashSaleForm.isActive} onChange={(e) => setFlashSaleForm({ ...flashSaleForm, isActive: e.target.checked })} className="rounded bg-black/30 border-white/10 text-blue-500 focus:ring-blue-500" />
              <label htmlFor="saleActive" className="text-sm text-gray-300 font-medium cursor-pointer select-none">Aktifkan langsung</label>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full">Simpan Promo Flash Sale</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
