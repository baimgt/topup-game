"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Game {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
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

  useEffect(() => {
    fetch("/api/games").then((r) => r.json()).then((d) => {
      if (d.success) setGames(d.data);
    });
  }, []);

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
            <Input label="Kategori" name="category" placeholder="Contoh: Diamond" value={form.category} onChange={handleChange} required />
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
    </div>
  );
}
