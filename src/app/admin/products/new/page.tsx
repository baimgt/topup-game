"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ImportProductsModal from "@/components/admin/ImportProductsModal";

interface Game {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [form, setForm] = useState({
    gameId: "",
    name: "",
    description: "",
    price: "",
    sellingPrice: "",
    digiflazzSku: "",
    category: "",
    sortOrder: "0",
  });

  const [gameCategories, setGameCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/games").then((r) => r.json()).then((d) => {
      if (d.success) setGames(d.data);
    });
  }, []);

  useEffect(() => {
    if (!form.gameId) {
      setGameCategories([]);
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`/api/admin/products?gameId=${form.gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          const cats = new Set<string>();
          d.data.forEach((p: any) => {
            if (p.category && p.category.trim()) cats.add(p.category.trim());
          });
          const list = Array.from(cats);
          setGameCategories(list);
          if (!form.category && list.length > 0) {
            setForm((prev) => ({ ...prev, category: list[0] }));
          }
        }
      });
  }, [form.gameId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          price: parseInt(form.price),
          sellingPrice: parseInt(form.sellingPrice),
          sortOrder: parseInt(form.sortOrder),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Produk berhasil ditambahkan!");
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan produk");
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

        {/* Auto Import Banner */}
        <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">
              ⚡
            </div>
            <div>
              <p className="text-white font-bold text-sm">Mau Tambah Banyak Produk Sekaligus?</p>
              <p className="text-gray-400 text-xs mt-0.5">Tambah puluhan produk Digiflazz ke game ini dalam 1-klik.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex-shrink-0 hover:scale-105"
          >
            <Zap className="w-4 h-4" />
            Auto Import Digiflazz
          </button>
        </div>

        <div className="bg-gaming-card rounded-2xl border border-white/5 p-6">
          <h1 className="text-xl font-bold text-white mb-6">Tambah Produk Baru</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Game</label>
              <select
                name="gameId"
                value={form.gameId}
                onChange={handleChange}
                className="w-full bg-gaming-card border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Pilih game</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <Input label="Nama Produk" name="name" placeholder="Contoh: 86 Diamond" value={form.name} onChange={handleChange} required />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi (opsional)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="w-full bg-gaming-card border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Harga Modal (Rp)" name="price" type="number" placeholder="15000" value={form.price} onChange={handleChange} required />
              <Input label="Harga Jual (Rp)" name="sellingPrice" type="number" placeholder="18000" value={form.sellingPrice} onChange={handleChange} required />
            </div>

            <Input label="SKU Digiflazz" name="digiflazzSku" placeholder="Contoh: mlbb-86-diamond" value={form.digiflazzSku} onChange={handleChange} required />
            
            <div>
              <Input label="Kategori Produk *" name="category" placeholder="Contoh: Bulanan, Pass, Top Up, Voucher" value={form.category} onChange={handleChange} required />
              {gameCategories.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <span className="text-[11px] text-gray-400 font-medium">Kategori yang Sudah Ada di Game Ini:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {gameCategories.map((cat) => {
                      const isSelected = form.category?.trim().toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
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

            <Input label="Urutan Tampil" name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} />

            <div className="flex gap-3 pt-2">
              <Link href="/admin" className="flex-1">
                <Button variant="secondary" size="lg" className="w-full">Batal</Button>
              </Link>
              <Button type="submit" variant="primary" size="lg" loading={loading} className="flex-1">
                Simpan Produk
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ImportProductsModal
        open={showImportModal}
        preselectedGame={form.gameId ? (games.find((g) => g.id === form.gameId) as any) : undefined}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          toast.success("Produk berhasil diimport!");
          router.push("/admin/products");
        }}
      />
    </div>
  );
}
