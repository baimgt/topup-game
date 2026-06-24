"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function NewGamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    category: "",
    statusCategory: "",
    sortOrder: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "sortOrder" ? parseInt(value) || 0 : value,
      ...(name === "name" && {
        slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      }),
    }));
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

  const categories = ["Mobile", "PC", "Console", "Battle Royale", "MOBA", "RPG", "Lainnya"];
  const statusCategories = ["Lagi Populer", "Baru Rilis", "Voucher", "Top Up Langsung", "Top Up Login", "Pulsa", "Entertainment"];

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

            <Input label="URL Gambar (opsional)" name="imageUrl" placeholder="https://..." value={form.imageUrl} onChange={handleChange} />
            <Input label="Urutan Tampil" name="sortOrder" type="number" value={form.sortOrder.toString()} onChange={handleChange} />

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
