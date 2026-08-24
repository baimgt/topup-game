"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function NewGamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    bannerUrl: "",
    iconUrl: "",
    category: "",
    statusCategory: "",
    isVoucher: false,
    sortOrder: 0,
    homeSortOrder: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: (name === "sortOrder" || name === "homeSortOrder") ? parseInt(value) || 0 : value,
      ...(name === "name" && {
        slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      }),
    }));
  };

  const categories = ["Mobile", "PC", "Console", "RPG", "Voucher", "Lainnya"];
  const statusCategories = ["Lagi Populer", "Baru Rilis", "Voucher", "Top Up Langsung", "Top Up Login", "Pulsa", "Entertainment"];

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, bannerUrl: data.url, imageUrl: data.url }));
        toast.success("Gambar banner berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah banner");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengunggah banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIcon(true);
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, iconUrl: data.url }));
        toast.success("Gambar icon berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah icon");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengunggah icon");
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Game berhasil ditambahkan!");
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>

        <div className="bg-gaming-card rounded-2xl border border-white/5 p-6">
          <h1 className="text-xl font-bold text-white mb-6">Tambah Game Baru</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nama Game" name="name" placeholder="Contoh: Mobile Legends" value={form.name} onChange={handleChange} required />
            <Input label="Slug (URL)" name="slug" placeholder="mobile-legends" value={form.slug} onChange={handleChange} required />

            {/* Tipe Produk / Game */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
              <label className="block text-sm font-bold text-white">⚙️ Tipe Produk</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isVoucher: false })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    !form.isVoucher
                      ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                      : "bg-black/20 border-white/5 text-gray-400 hover:bg-white/5"
                  }`}
                >
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    🎮 Top Up Game (Pakai ID Akun)
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Pembeli wajib mengisi User ID &amp; Server ID game.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, isVoucher: true })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    form.isVoucher
                      ? "bg-cyan-600/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-black/20 border-white/5 text-gray-400 hover:bg-white/5"
                  }`}
                >
                  <div className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                    🎟️ Voucher / Kode Digital (Tanpa ID Akun)
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Tanpa input ID. SN otomatis diterbitkan &amp; dikirim ke email.
                  </div>
                </button>
              </div>

              {form.isVoucher && (
                <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-3 text-xs text-cyan-200 flex items-center gap-2">
                  <span>✨</span>
                  <span><strong>Mode Voucher Aktif:</strong> Pelanggan tidak akan dimintai User ID saat checkout. Serial Number (SN) dari Digiflazz akan otomatis dikirimkan via email khusus SN.</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Kategori</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-gaming-card border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Status Kategori (Tampil di Home)</label>
              <select
                name="statusCategory"
                value={form.statusCategory}
                onChange={handleChange}
                className="w-full bg-gaming-card border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tanpa Status Kategori (Tidak Tampil di Home)</option>
                {statusCategories.map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Deskripsi singkat game..."
                className="w-full bg-gaming-card border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* URL Gambar Banner / Cover */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-3.5 space-y-2">
              <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                🖼️ Gambar Banner / Cover Game (Landscape)
              </label>
              <div className="flex gap-2 items-center">
                <Input 
                  name="bannerUrl"
                  value={form.bannerUrl || form.imageUrl} 
                  onChange={(e) => setForm({ ...form, bannerUrl: e.target.value, imageUrl: e.target.value })} 
                  placeholder="https://... atau klik tombol Unggah Banner" 
                />
                <label className={`flex items-center justify-center gap-1.5 px-4 py-3 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex-shrink-0 ${uploadingBanner ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="w-4 h-4" />
                  {uploadingBanner ? "Mengunggah..." : "Unggah Banner"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleBannerUpload} 
                    className="hidden" 
                  />
                </label>
              </div>
              {(form.bannerUrl || form.imageUrl) && (
                <div className="mt-2 relative h-24 w-full rounded-lg overflow-hidden border border-white/10 bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.bannerUrl || form.imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* URL Gambar Icon Game (Persegi) */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-3.5 space-y-2">
              <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider">
                🎮 Gambar Icon Game (Logo / Persegi)
              </label>
              <div className="flex gap-2 items-center">
                <Input 
                  name="iconUrl"
                  value={form.iconUrl} 
                  onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} 
                  placeholder="https://... atau klik tombol Unggah Icon" 
                />
                <label className={`flex items-center justify-center gap-1.5 px-4 py-3 bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/30 text-cyan-300 hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex-shrink-0 ${uploadingIcon ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="w-4 h-4" />
                  {uploadingIcon ? "Mengunggah..." : "Unggah Icon"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleIconUpload} 
                    className="hidden" 
                  />
                </label>
              </div>
              {form.iconUrl && (
                <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-cyan-500/30 bg-black/40 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.iconUrl} alt="Icon Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3.5 space-y-1">
                <Input
                  label="🏠 Urutan di Tab Kategori Beranda"
                  name="homeSortOrder"
                  type="number"
                  value={form.homeSortOrder.toString()}
                  onChange={handleChange}
                />
                <p className="text-[11px] text-purple-300">Posisi di tab kategori Beranda (1 = Paling Depan/Kiri).</p>
              </div>
              <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3.5 space-y-1">
                <Input
                  label="🎮 Urutan di Halaman /games"
                  name="sortOrder"
                  type="number"
                  value={form.sortOrder.toString()}
                  onChange={handleChange}
                />
                <p className="text-[11px] text-cyan-300">Posisi di Daftar Semua Game / Kategori Game (1 = Paling Depan/Kiri).</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin" className="flex-1">
                <Button variant="secondary" size="lg" className="w-full">Batal</Button>
              </Link>
              <Button type="submit" variant="primary" size="lg" loading={loading} className="flex-1">
                Simpan Game
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
