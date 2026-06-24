"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Search, Filter, RefreshCw, ExternalLink, Edit2, Eye, User, Gamepad2, CreditCard, Cpu } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const STATUS_OPTIONS = ["ALL", "PENDING", "PAID", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [editOrder, setEditOrder] = useState<any>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [editOrderStatus, setEditOrderStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({ page: String(page), limit: "20", status });
    if (search) params.set("search", search);

    const res = await fetch(`/api/admin/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setOrders(data.data.orders);
      setPagination(data.data.pagination);
    }
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleEditClick = (order: any) => {
    setEditOrder(order);
    setEditPaymentStatus(order.paymentStatus);
    setEditOrderStatus(order.orderStatus);
  };

  const handleSaveStatus = async () => {
    if (!editOrder) return;
    setSavingStatus(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/orders/${editOrder._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus: editPaymentStatus, orderStatus: editOrderStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Status berhasil diubah");
        setEditOrder(null);
        fetchOrders();
      } else {
        toast.error(data.error || "Gagal mengubah status");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Data Transaksi</h1>
          <p className="text-gray-400 text-sm mt-1">Total {pagination.total} transaksi terdaftar.</p>
        </div>
        <button onClick={fetchOrders} className="relative z-10 flex items-center gap-2 bg-black/20 hover:bg-black/40 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg">
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-5 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. pesanan, nama, email, game..."
            className="w-full bg-black/20 border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow"
          />
        </form>
        <div className="relative min-w-[200px] flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div className="relative w-full">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow appearance-none cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "Semua Status" : s}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                {["No. Pesanan", "Game", "ID Akun", "Pembeli", "Total", "Status Bayar", "Status Proses", "Tanggal", ""].map((h) => (
                  <th key={h} className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-16 text-center text-gray-500 text-sm">Tidak ada transaksi ditemukan</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-cyan-400 font-mono text-sm font-medium transition-colors group-hover:text-cyan-300">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 text-white text-xs font-medium border border-white/10">
                      {order.gameName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-gray-300 text-xs font-mono bg-black/30 px-2 py-1 rounded-md border border-white/5">
                        {order.gameUserId}
                        {order.gameServerId ? ` / ${order.gameServerId}` : ""}
                      </span>
                      {order.gameUsername && (
                        <span className="text-purple-400 text-[11px] font-semibold truncate max-w-[150px]" title={order.gameUsername}>
                          {order.gameUsername}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white text-sm font-bold">{order.customerName}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-white text-sm font-black tracking-tight whitespace-nowrap">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4"><PaymentStatusBadge status={order.paymentStatus} /></td>
                  <td className="px-6 py-4"><OrderStatusBadge status={order.orderStatus} /></td>
                  <td className="px-6 py-4 text-gray-400 text-sm whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    <div className="text-gray-500 text-xs mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedOrder(order)} className="p-2 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all border border-transparent hover:border-cyan-500/30" title="Detail Transaksi">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(order)} className="p-2 rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all border border-transparent hover:border-blue-500/30" title="Ubah Status">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <Link href={`/order/${order.orderNumber}`} target="_blank" title="Lihat Invoice">
                        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/5">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-gray-500 text-xs">
              Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                ← Prev
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!editOrder} onClose={() => setEditOrder(null)} title="Edit Status Pesanan">
        <div className="space-y-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="text-gray-400 text-sm">No. Pesanan</p>
            <p className="text-white font-mono">{editOrder?.orderNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status Pembayaran</label>
            <select
              value={editPaymentStatus}
              onChange={(e) => setEditPaymentStatus(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="UNPAID">Belum Bayar (UNPAID)</option>
              <option value="PAID">Lunas (PAID)</option>
              <option value="EXPIRED">Kadaluarsa (EXPIRED)</option>
              <option value="FAILED">Gagal (FAILED)</option>
              <option value="REFUNDED">Dikembalikan (REFUNDED)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status Pemrosesan (Order)</label>
            <select
              value={editOrderStatus}
              onChange={(e) => setEditOrderStatus(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="PENDING">Menunggu (PENDING)</option>
              <option value="PROCESSING">Diproses (PROCESSING)</option>
              <option value="SUCCESS">Berhasil (SUCCESS)</option>
              <option value="FAILED">Gagal (FAILED)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
            <Button variant="secondary" onClick={() => setEditOrder(null)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveStatus} loading={savingStatus}>Simpan Perubahan</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Detail Transaksi" size="lg">
        {selectedOrder && (
          <div className="space-y-6 text-sm">
            {/* Top Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Status Bayar</p>
                <PaymentStatusBadge status={selectedOrder.paymentStatus} />
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Status Order</p>
                <OrderStatusBadge status={selectedOrder.orderStatus} />
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl col-span-2">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">No. Pesanan</p>
                <span className="text-cyan-400 font-mono font-bold text-sm tracking-tight">{selectedOrder.orderNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Info Pelanggan & Game */}
              <div className="space-y-4">
                {/* Pelanggan */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                  <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/5 pb-2">
                    <User className="w-4 h-4 text-purple-400" /> Informasi Pelanggan
                  </h3>
                  <div>
                    <p className="text-gray-500 text-xs">Nama Lengkap</p>
                    <p className="text-white font-semibold">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Alamat Email</p>
                    <p className="text-white font-semibold">{selectedOrder.customerEmail}</p>
                  </div>
                </div>

                {/* Game & Akun */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                  <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/5 pb-2">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" /> Akun & Tujuan Game
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-500 text-xs">Nama Game</p>
                      <p className="text-white font-bold">{selectedOrder.gameName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">User ID / Server</p>
                      <p className="text-white font-semibold font-mono">
                        {selectedOrder.gameUserId}
                        {selectedOrder.gameServerId ? ` (${selectedOrder.gameServerId})` : ""}
                      </p>
                    </div>
                    {selectedOrder.gameUsername && (
                      <div className="col-span-2 border-t border-white/5 pt-2">
                        <p className="text-gray-500 text-xs">Nama Akun (Nickname)</p>
                        <p className="text-purple-400 font-bold text-sm">{selectedOrder.gameUsername}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaksi & Pembayaran */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                  <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/5 pb-2">
                    <CreditCard className="w-4 h-4 text-blue-400" /> Rincian Pembayaran
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-gray-500">Metode Pembayaran</span>
                    <span className="text-white font-semibold text-right">{selectedOrder.paymentMethod || "Tidak diketahui"}</span>

                    <span className="text-gray-500">Dibuat Tanggal</span>
                    <span className="text-white text-right font-mono">
                      {new Date(selectedOrder.createdAt).toLocaleString("id-ID")}
                    </span>

                    <span className="text-gray-500">Waktu Pembayaran</span>
                    <span className="text-white text-right font-mono">
                      {selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleString("id-ID") : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Items & Supplier Sync */}
              <div className="space-y-4">
                {/* Produk / Item */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                  <h3 className="text-white font-bold flex items-center justify-between border-b border-white/5 pb-2">
                    <span>Produk yang Dibeli</span>
                    <span className="text-cyan-400 font-black text-base">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.orderItems?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                        <div>
                          <p className="text-white font-bold text-sm">{item.productName}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{item.quantity}x @ {formatCurrency(item.price)}</p>
                        </div>
                        <p className="text-white font-black text-sm">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Integrasi Digiflazz */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                  <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/5 pb-2">
                    <Cpu className="w-4 h-4 text-orange-400" /> Integrasi Supplier (Digiflazz)
                  </h3>
                  <div>
                    <p className="text-gray-500 text-xs">Reference ID (Ref ID)</p>
                    <p className="text-white font-mono font-semibold select-all bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5 mt-1 text-xs break-all">
                      {selectedOrder.digiflazzRef || "Belum diproses / Tidak ada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Notes / Log Respon</p>
                    <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 mt-1 text-xs max-h-24 overflow-y-auto">
                      <p className={`${selectedOrder.orderStatus === "FAILED" ? "text-red-400" : "text-gray-300"}`}>
                        {selectedOrder.notes || "Tidak ada catatan respon supplier."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-6">
              <Button variant="secondary" onClick={() => { setSelectedOrder(null); handleEditClick(selectedOrder); }}>
                <Edit2 className="w-4 h-4" /> Ubah Status Manual
              </Button>
              <Button variant="primary" onClick={() => setSelectedOrder(null)}>Tutup Detail</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
