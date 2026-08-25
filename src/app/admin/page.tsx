"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, Users, Gamepad2, TrendingUp, CheckCircle,
  Clock, XCircle, ArrowUpRight, ArrowDownRight, Trophy, DollarSign,
  Coins, Sparkles, Layers, Percent,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { RevenueAreaChart, ProfitAreaChart, OrdersBarChart } from "@/components/admin/RevenueChart";

interface Stats {
  totalOrders: number;
  successOrders: number;
  pendingOrders: number;
  failedOrders: number;
  totalRevenue: number;
  totalProfit: number;
  thisMonthProfit: number;
  lastMonthProfit: number;
  profitGrowth: string;
  totalUsers: number;
  totalGames: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: string;
  recentOrders: any[];
  chartData: { month: string; revenue: number; profit?: number; orders: number }[];
  topGames: { _id: string; count: number; revenue: number }[];
  marginStats?: {
    totalProducts: number;
    avgMarginRp: number;
    avgMarginPercent: string;
    totalCatalogMargin: number;
    totalCatalogCost: number;
    totalCatalogSelling: number;
    topMarginProducts: Array<{
      _id: string;
      name: string;
      gameName: string;
      gameImage: string;
      costPrice: number;
      sellingPrice: number;
      marginRp: number;
      marginPercent: number;
    }>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"revenue" | "profit" | "orders">("revenue");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    fetch("/api/admin/stats", { headers })
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const growth = parseFloat(stats?.revenueGrowth || "0");
  const profitGrowthNum = parseFloat(stats?.profitGrowth || "0");

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      sub: `Bulan ini: ${formatCurrency(stats?.thisMonthRevenue || 0)}`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-purple-500/20 to-purple-600/5",
      iconColor: "text-purple-400",
      border: "border-purple-500/20",
    },
    {
      label: "Keuntungan Margin",
      value: formatCurrency(stats?.totalProfit || 0),
      sub: `Bulan ini: ${formatCurrency(stats?.thisMonthProfit || 0)}`,
      icon: <Coins className="w-5 h-5" />,
      color: "from-emerald-500/20 to-emerald-600/5",
      iconColor: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: "Total Transaksi",
      value: stats?.totalOrders || 0,
      sub: `${stats?.successOrders || 0} berhasil`,
      icon: <ShoppingBag className="w-5 h-5" />,
      color: "from-blue-500/20 to-blue-600/5",
      iconColor: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      label: "Rata-rata Margin",
      value: `${stats?.marginStats?.avgMarginPercent || 0}%`,
      sub: `Rp ${formatCurrency(stats?.marginStats?.avgMarginRp || 0)} / item`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "from-amber-500/20 to-amber-600/5",
      iconColor: "text-amber-400",
      border: "border-amber-500/20",
    },
    {
      label: "Total Produk Aktif",
      value: `${stats?.marginStats?.totalProducts || 0} Produk`,
      sub: `dari ${stats?.totalGames || 0} Game`,
      icon: <Gamepad2 className="w-5 h-5" />,
      color: "from-cyan-500/20 to-cyan-600/5",
      iconColor: "text-cyan-400",
      border: "border-cyan-500/20",
    },
  ];

  const statusCards = [
    { label: "Berhasil", value: stats?.successOrders || 0, icon: <CheckCircle className="w-4 h-4" />, color: "text-green-400" },
    { label: "Pending", value: stats?.pendingOrders || 0, icon: <Clock className="w-4 h-4" />, color: "text-yellow-400" },
    { label: "Gagal", value: stats?.failedOrders || 0, icon: <XCircle className="w-4 h-4" />, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Dashboard Overview</h1>
          <p className="text-gray-400 text-sm mt-1">Ringkasan performa penjualan & keuntungan margin produk toko Anda.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <div className="bg-black/20 px-4 py-3 rounded-xl border border-white/5 text-right">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Pertumbuhan Revenue</p>
            <div className={`flex items-center gap-1.5 justify-end font-bold text-base ${growth >= 0 ? "text-green-400" : "text-red-400"}`}>
              {growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{Math.abs(growth)}%</span>
            </div>
          </div>
          <div className="bg-black/20 px-4 py-3 rounded-xl border border-white/5 text-right">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Pertumbuhan Margin</p>
            <div className={`flex items-center gap-1.5 justify-end font-bold text-base ${profitGrowthNum >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {profitGrowthNum >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{Math.abs(profitGrowthNum)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {statCards.map((card) => (
          <div key={card.label} className={`relative overflow-hidden bg-gradient-to-br ${card.color} rounded-2xl border ${card.border} p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg group`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-current opacity-[0.05] rounded-full blur-2xl group-hover:opacity-10 transition-opacity ${card.iconColor}`} />
            <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center ${card.iconColor} mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]`}>
              {card.icon}
            </div>
            <div className="text-2xl font-black text-white tracking-tight">{card.value}</div>
            <div className="text-gray-400 text-sm font-medium mt-1">{card.label}</div>
            <div className="text-gray-500 text-xs mt-3 flex items-center gap-1.5 bg-black/20 w-fit px-2.5 py-1 rounded-md border border-white/5">
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Status mini cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusCards.map((s) => (
          <div key={s.label} className="bg-white/[0.02] backdrop-blur-md rounded-xl border border-white/5 p-4 flex items-center gap-4 transition-colors hover:bg-white/[0.04]">
            <div className={`w-12 h-12 rounded-full bg-black/20 flex items-center justify-center border border-white/5 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <div className="text-xl font-black text-white">{s.value}</div>
              <div className="text-gray-500 text-sm font-medium">Order {s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Grafik Tren 6 Bulan Terakhir</h2>
              <p className="text-gray-400 text-sm mt-1">Perbandingan omset, keuntungan margin bersih, dan volume transaksi</p>
            </div>
            <div className="flex gap-1.5 bg-black/20 rounded-xl p-1.5 border border-white/5">
              <button
                onClick={() => setActiveChart("revenue")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeChart === "revenue" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChart("profit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeChart === "profit" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                Keuntungan
              </button>
              <button
                onClick={() => setActiveChart("orders")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeChart === "orders" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                Transaksi
              </button>
            </div>
          </div>
          {stats?.chartData && stats.chartData.length > 0 ? (
            <div className="relative z-10">
              {activeChart === "revenue" && <RevenueAreaChart data={stats.chartData} />}
              {activeChart === "profit" && <ProfitAreaChart data={stats.chartData} />}
              {activeChart === "orders" && <OrdersBarChart data={stats.chartData} />}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm bg-black/10 rounded-xl border border-white/5">
              Belum ada data transaksi
            </div>
          )}
        </div>

        {/* Top Games */}
        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Top Games</h2>
              <p className="text-gray-400 text-xs mt-0.5">Penjualan terlaris</p>
            </div>
          </div>
          <div className="space-y-4">
            {stats?.topGames && stats.topGames.length > 0 ? (
              stats.topGames.map((g, i) => (
                <div key={g._id} className="flex items-center gap-4 group p-2 rounded-xl transition-colors hover:bg-white/5">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 shadow-lg ${
                    i === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-yellow-500/20" :
                    i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-gray-500/20" :
                    i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-500/20" :
                    "bg-black/30 text-gray-500 border border-white/5"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate group-hover:text-purple-400 transition-colors">{g._id}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{g.count} Transaksi</p>
                  </div>
                  <span className="text-cyan-400 text-sm font-black flex-shrink-0 tracking-tight">
                    {formatCurrency(g.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-500 text-sm bg-black/10 rounded-xl border border-white/5">
                Belum ada data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FITUR ANALISIS MARGIN KEUNTUNGAN PRODUK ───────────────────────── */}
      <div className="bg-gradient-to-b from-emerald-500/10 via-white/[0.02] to-transparent rounded-2xl border border-emerald-500/20 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Analisis Margin Keuntungan Produk
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                  Live Margin
                </span>
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Laporan detail margin keuntungan (selisih harga jual vs modal Digiflazz) dari seluruh produk aktif.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/40 border border-white/10 px-3.5 py-2 rounded-xl text-xs">
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Margin Katalog</span>
              <span className="text-emerald-400 font-bold text-sm">
                {formatCurrency(stats?.marginStats?.totalCatalogMargin || 0)}
              </span>
            </div>
            <Link
              href="/admin/products"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all"
            >
              Kelola Semua Produk →
            </Link>
          </div>
        </div>

        {/* Product Margin Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>Total Produk Aktif</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">{stats?.marginStats?.totalProducts || 0} Item</div>
            <p className="text-gray-500 text-[11px] mt-1">Siap dijual di katalog toko</p>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>Rata-Rata Margin (Rp)</span>
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {formatCurrency(stats?.marginStats?.avgMarginRp || 0)}
            </div>
            <p className="text-gray-500 text-[11px] mt-1">Keuntungan per produk</p>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>Rata-Rata Margin (%)</span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400">
              {stats?.marginStats?.avgMarginPercent || 0}%
            </div>
            <p className="text-gray-500 text-[11px] mt-1">Persentase markup rata-rata</p>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
              <span>Keuntungan Terkumpul</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-400">
              {formatCurrency(stats?.totalProfit || 0)}
            </div>
            <p className="text-gray-500 text-[11px] mt-1">Dari transaksi berstatus sukses</p>
          </div>
        </div>

        {/* Top Margin Products Table */}
        <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              🏆 Produk dengan Margin Keuntungan Terbesar
            </h3>
            <span className="text-gray-500 text-xs">Top 6 Rekomendasi Profit</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-gray-400">
                  <th className="px-5 py-3 font-semibold">Game & Produk</th>
                  <th className="px-5 py-3 font-semibold text-right">Modal Supplier</th>
                  <th className="px-5 py-3 font-semibold text-right">Harga Jual</th>
                  <th className="px-5 py-3 font-semibold text-right text-emerald-400">Keuntungan Bersih (Rp)</th>
                  <th className="px-5 py-3 font-semibold text-right text-amber-400">Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.marginStats?.topMarginProducts && stats.marginStats.topMarginProducts.length > 0 ? (
                  stats.marginStats.topMarginProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-gray-400 text-[11px]">{p.gameName}</div>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 font-mono">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td className="px-5 py-3 text-right text-white font-bold font-mono">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-400 font-mono">
                        + {formatCurrency(p.marginRp)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                          {p.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                      Belum ada data produk
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white">Transaksi Terbaru</h2>
            <p className="text-gray-400 text-sm mt-1">10 order terakhir yang masuk ke sistem.</p>
          </div>
          <Link href="/admin/orders" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-sm font-medium transition-colors border border-purple-500/20">
            Lihat Semua <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                {["No. Pesanan", "Game", "Pembeli", "Total", "Status Bayar", "Status Proses", "Tanggal"].map((h) => (
                  <th key={h} className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats?.recentOrders?.map((order) => (
                <tr key={order._id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/order/${order.orderNumber}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-sm font-medium transition-colors">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 text-white text-xs font-medium border border-white/10 group-hover:border-purple-500/30 transition-colors">
                      {order.gameName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white text-sm font-bold">{order.customerName}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-white text-sm font-black tracking-tight">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-6 py-4"><PaymentStatusBadge status={order.paymentStatus} /></td>
                  <td className="px-6 py-4"><OrderStatusBadge status={order.orderStatus} /></td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">Belum ada transaksi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
