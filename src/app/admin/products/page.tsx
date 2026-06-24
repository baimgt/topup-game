"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("ALL");
  const [games, setGames] = useState<any[]>([]);

  const fetchProducts = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/products", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setProducts(data.data);
      setFiltered(data.data);
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

  useEffect(() => {
    let result = products;
    if (search) result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.digiflazzSku.toLowerCase().includes(search.toLowerCase()));
    if (gameFilter !== "ALL") result = result.filter((p) => (p.gameId?._id || p.gameId) === gameFilter);
    setFiltered(result);
  }, [search, gameFilter, products]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Data Produk</h1>
          <p className="text-gray-400 text-sm mt-1">Kelola {filtered.length} produk top-up yang aktif.</p>
        </div>
        <Link href="/admin/products/new" className="relative z-10">
          <button className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/25 hover:scale-105">
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-5 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk atau SKU..."
            className="w-full bg-black/20 border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow"
          />
        </div>
        <div className="relative min-w-[200px]">
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow appearance-none cursor-pointer"
          >
            <option value="ALL">Semua Game</option>
            {games.map((g) => <option key={g._id || g.id} value={g._id || g.id}>{g.name}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                {["Produk", "Game", "SKU Digiflazz", "Harga Modal", "Harga Jual", "Margin", "Status", "Aksi"].map((h) => (
                  <th key={h} className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-gray-500 text-sm">Tidak ada produk ditemukan</td></tr>
              ) : filtered.map((p) => {
                const margin = p.sellingPrice - p.price;
                const marginPct = ((margin / p.price) * 100).toFixed(0);
                return (
                  <tr key={p._id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-white text-sm font-bold group-hover:text-cyan-400 transition-colors">{p.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{p.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 text-gray-300 text-xs font-medium border border-white/10">
                        {p.gameId?.name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 font-mono text-xs bg-black/30 px-2.5 py-1 rounded-md border border-white/5">{p.digiflazzSku}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4 text-white text-sm font-black tracking-tight">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                        +{formatCurrency(margin)} ({marginPct}%)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={p.isActive ? "success" : "default"} className="text-[10px] uppercase tracking-wider px-2 py-0.5">
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(p._id, p.isActive)}
                        className={`p-2 rounded-lg transition-all border ${
                          p.isActive 
                            ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20" 
                            : "border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20"
                        }`}
                        title={p.isActive ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {p.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
