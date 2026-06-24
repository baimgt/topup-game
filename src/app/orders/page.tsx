"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Search, ExternalLink, CheckCircle,
  Clock, XCircle, TrendingUp, Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Order {
  _id: string;
  orderNumber: string;
  gameName: string;
  gameUserId: string;
  gameServerId?: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod?: string;
  paymentUrl?: string;
  orderItems: { productName: string; quantity: number; price: number }[];
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  successCount: number;
  totalSpent: number;
}

const STATUS_TABS = [
  { key: "ALL", label: "Semua" },
  { key: "PENDING", label: "Menunggu" },
  { key: "SUCCESS", label: "Berhasil" },
  { key: "PROCESSING", label: "Diproses" },
  { key: "FAILED", label: "Gagal" },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }

    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (activeStatus !== "ALL") params.set("status", activeStatus);

    const res = await fetch(`/api/user/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      setOrders(data.data.orders);
      setPagination(data.data.pagination);
      if (data.data.stats) setStats(data.data.stats);
    } else if (res.status === 401) {
      router.push("/auth/login");
    }
    setLoading(false);
  }, [page, activeStatus, router]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Client-side search filter
  const filtered = search
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.gameName.toLowerCase().includes(search.toLowerCase()) ||
          o.orderItems.some((i) => i.productName.toLowerCase().includes(search.toLowerCase()))
      )
    : orders;

  const statusIcon = (status: string) => {
    if (status === "SUCCESS") return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === "FAILED") return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Riwayat Pesanan</h1>
          <p className="text-gray-400 text-sm mt-1">Semua transaksi top up kamu</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Total Pesanan",
                value: stats.totalOrders,
                icon: <ShoppingBag className="w-5 h-5 text-blue-400" />,
                color: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
              },
              {
                label: "Berhasil",
                value: stats.successCount,
                icon: <CheckCircle className="w-5 h-5 text-green-400" />,
                color: "from-green-500/10 to-green-600/5 border-green-500/20",
              },
              {
                label: "Total Belanja",
                value: formatCurrency(stats.totalSpent),
                icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
                color: "from-purple-500/10 to-purple-600/5 border-purple-500/20",
              },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl border p-4`}>
                <div className="mb-2">{s.icon}</div>
                <div className="text-white font-bold text-lg">{s.value}</div>
                <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          {/* Status tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveStatus(tab.key); setPage(1); }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeStatus === tab.key
                    ? "bg-purple-600 text-white"
                    : "bg-gaming-card border border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. pesanan atau nama game..."
              className="w-full bg-gaming-card border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gaming-card rounded-2xl border border-white/5 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-gaming-card rounded-2xl border border-white/5 p-16 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Belum ada pesanan</p>
            <p className="text-gray-600 text-sm mt-1">Yuk mulai top up game favoritmu!</p>
            <Link href="/games" className="inline-block mt-4">
              <Button variant="primary" size="sm">Lihat Game</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div
                key={order._id}
                className="bg-gaming-card rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Game icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5">
                      <span className="text-white font-bold text-lg">{order.gameName.charAt(0)}</span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-white font-semibold text-sm">{order.gameName}</h3>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {order.orderItems[0]?.productName}
                            {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} lainnya`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <PaymentStatusBadge status={order.paymentStatus} />
                          <OrderStatusBadge status={order.orderStatus} />
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                        <div className="flex items-center gap-1.5">
                          {statusIcon(order.orderStatus)}
                          <span className="text-white font-bold text-sm">{formatCurrency(order.totalAmount)}</span>
                        </div>
                        <span className="text-gray-600 text-xs hidden sm:block">•</span>
                        <span className="text-gray-500 text-xs">ID: {order.gameUserId}{order.gameServerId ? ` / ${order.gameServerId}` : ""}</span>
                        <span className="text-gray-600 text-xs hidden sm:block">•</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(order.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Order number */}
                      <p className="text-gray-600 text-xs mt-1 font-mono">{order.orderNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="border-t border-white/5 px-5 py-3 flex items-center justify-between bg-gaming-dark/20">
                  <span className="text-gray-500 text-xs">
                    {order.paymentMethod ? order.paymentMethod.replace(/_/g, " ").toUpperCase() : "—"}
                  </span>
                  <div className="flex gap-2">
                    {order.paymentStatus === "UNPAID" && order.paymentUrl && (
                      <a href={order.paymentUrl}>
                        <Button variant="primary" size="sm">Bayar Sekarang</Button>
                      </a>
                    )}
                    <Link href={`/order/${order.orderNumber}`}>
                      <Button variant="ghost" size="sm">
                        Detail <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && !search && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-2 py-1 text-gray-500 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === p ? "bg-purple-600 text-white" : "bg-gaming-card text-gray-400 hover:text-white border border-white/10"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
