"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, RefreshCw, Home, Search } from "lucide-react";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { QRCodeSVG } from "qrcode.react";

export default function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      const data = await res.json();
      if (data.success) setOrder(data.data);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Auto-refresh for pending/processing orders
    const interval = setInterval(() => {
      if (order?.paymentStatus === "UNPAID" || order?.orderStatus === "PENDING" || order?.orderStatus === "PROCESSING") {
        fetchOrder();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [orderNumber, order?.paymentStatus, order?.orderStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Pesanan Tidak Ditemukan</h1>
          <p className="text-gray-400 mb-6">Nomor pesanan tidak valid atau sudah dihapus</p>
          <Link href="/">
            <Button variant="primary">Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = {
    SUCCESS: { icon: <CheckCircle className="w-16 h-16 text-green-400" />, title: "Pesanan Berhasil!", color: "text-green-400" },
    PROCESSING: { icon: <Clock className="w-16 h-16 text-purple-400" />, title: "Sedang Diproses", color: "text-purple-400" },
    PENDING: { icon: <Clock className="w-16 h-16 text-yellow-400" />, title: "Menunggu Diproses", color: "text-yellow-400" },
    FAILED: { icon: <XCircle className="w-16 h-16 text-red-400" />, title: "Transaksi Gagal", color: "text-red-400" },
  };

  const config = statusConfig[order.orderStatus as keyof typeof statusConfig] || statusConfig.PENDING;

  // Jika belum bayar, timpa tampilan utama
  if (order.paymentStatus === "UNPAID") {
    config.title = "Menunggu Pembayaran";
    config.icon = <Clock className="w-16 h-16 text-yellow-400" />;
    config.color = "text-yellow-400";
  } else if (order.paymentStatus === "EXPIRED" || order.paymentStatus === "FAILED") {
    config.title = "Pembayaran Kadaluarsa / Gagal";
    config.icon = <XCircle className="w-16 h-16 text-gray-400" />;
    config.color = "text-gray-400";
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Status Card */}
        <div className="bg-gaming-card rounded-2xl border border-white/5 p-8 text-center mb-6">
          <div className="flex justify-center mb-4">{config.icon}</div>
          <h1 className={`text-2xl font-bold mb-2 ${config.color}`}>{config.title}</h1>
          <p className="text-gray-400 text-sm mb-4">
            No. Pesanan: <span className="text-white font-mono">{order.orderNumber}</span>
          </p>
          <div className="flex items-center justify-center gap-2">
            <PaymentStatusBadge status={order.paymentStatus} />
            <OrderStatusBadge status={order.orderStatus} />
          </div>
        </div>

        {/* Progress Stepper / Timeline */}
        <div className="bg-gaming-card rounded-2xl border border-white/5 p-6 mb-6">
          <h2 className="text-white font-semibold mb-5 text-left text-sm tracking-wide uppercase text-gray-400">Status Pemrosesan</h2>
          <div className="relative pl-6 border-l-2 border-white/5 space-y-6">
            {/* Step 1: Pembayaran */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-[#0a0a0f] flex items-center justify-center ${
                order.paymentStatus === "PAID" 
                  ? "border-green-500 bg-green-500/20" 
                  : (order.paymentStatus === "EXPIRED" || order.paymentStatus === "FAILED")
                    ? "border-red-500 bg-red-500/20"
                    : "border-yellow-500 animate-pulse bg-yellow-500/10"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  order.paymentStatus === "PAID" 
                    ? "bg-green-500" 
                    : (order.paymentStatus === "EXPIRED" || order.paymentStatus === "FAILED")
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {order.paymentStatus === "PAID" 
                    ? "Pembayaran Berhasil" 
                    : (order.paymentStatus === "EXPIRED" || order.paymentStatus === "FAILED")
                      ? "Pembayaran Gagal / Kadaluarsa"
                      : "Menunggu Pembayaran"}
                </p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {order.paymentStatus === "PAID" 
                    ? `Verifikasi instan otomatis selesai pada ${order.paidAt ? new Date(order.paidAt).toLocaleString("id-ID") : ""}`
                    : (order.paymentStatus === "EXPIRED" || order.paymentStatus === "FAILED")
                      ? "Pembayaran dibatalkan karena tidak diselesaikan atau ditolak bank."
                      : "Silakan selesaikan pembayaran agar item game Anda dapat langsung dikirim otomatis."}
                </p>
              </div>
            </div>

            {/* Step 2: Pemrosesan */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-[#0a0a0f] flex items-center justify-center ${
                order.orderStatus === "SUCCESS"
                  ? "border-green-500 bg-green-500/20"
                  : order.orderStatus === "FAILED"
                    ? "border-red-500 bg-red-500/20"
                    : order.paymentStatus === "PAID"
                      ? "border-purple-500 animate-pulse bg-purple-500/10"
                      : "border-white/10"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  order.orderStatus === "SUCCESS"
                    ? "bg-green-500"
                    : order.orderStatus === "FAILED"
                      ? "bg-red-500"
                      : order.paymentStatus === "PAID"
                        ? "bg-purple-500"
                        : "bg-gray-700"
                }`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${order.paymentStatus === "PAID" ? "text-white" : "text-gray-500"}`}>
                  {order.orderStatus === "SUCCESS"
                    ? "Pesanan Selesai Diproses"
                    : order.orderStatus === "FAILED"
                      ? "Pesanan Gagal Diproses"
                      : order.orderStatus === "PROCESSING"
                        ? "Sedang Diproses"
                        : order.paymentStatus === "PAID"
                          ? "Pesanan Masuk Antrean"
                          : "Menunggu Antrean"}
                </p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {order.orderStatus === "SUCCESS"
                    ? "Sistem berhasil memvalidasi dan meneruskan pesanan ke pihak supplier."
                    : order.orderStatus === "FAILED"
                      ? `Pemrosesan gagal: ${order.notes || "Silakan hubungi customer support."}`
                      : order.orderStatus === "PROCESSING"
                        ? "Sistem sedang memproses pembelian Anda ke API supplier secara real-time."
                        : order.paymentStatus === "PAID"
                          ? "Pembayaran terverifikasi. Pesanan Anda berada dalam antrean pemrosesan otomatis."
                          : "Pesanan akan masuk antrean secara otomatis setelah pembayaran sukses."}
                </p>
              </div>
            </div>

            {/* Step 3: Pengiriman / Selesai */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-[#0a0a0f] flex items-center justify-center ${
                order.orderStatus === "SUCCESS"
                  ? "border-green-500 bg-green-500/20"
                  : order.orderStatus === "FAILED"
                    ? "border-red-500 bg-red-500/20"
                    : (order.paymentStatus === "PAID" && order.orderStatus === "PROCESSING")
                      ? "border-cyan-500 animate-pulse bg-cyan-500/10"
                      : "border-white/10"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  order.orderStatus === "SUCCESS"
                    ? "bg-green-500"
                    : order.orderStatus === "FAILED"
                      ? "bg-red-500"
                      : (order.paymentStatus === "PAID" && order.orderStatus === "PROCESSING")
                        ? "bg-cyan-500"
                        : "bg-gray-700"
                }`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${order.orderStatus === "SUCCESS" ? "text-white" : "text-gray-500"}`}>
                  {order.orderStatus === "SUCCESS"
                    ? "Top-up Berhasil Masuk"
                    : order.orderStatus === "FAILED"
                      ? "Pengiriman Saldo Gagal"
                      : (order.paymentStatus === "PAID" && order.orderStatus === "PROCESSING")
                        ? "Sedang Dikirim Ke ID Game"
                        : "Menunggu Pengiriman"}
                </p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {order.orderStatus === "SUCCESS"
                    ? "Item game / diamond telah sukses dikirimkan ke ID game Anda. Silakan cek akun game Anda."
                    : order.orderStatus === "FAILED"
                      ? "Pengiriman produk gagal dilakukan ke ID tujuan."
                      : (order.paymentStatus === "PAID" && order.orderStatus === "PROCESSING")
                        ? "Proses injeksi item/diamond sedang berjalan langsung ke akun Anda."
                        : "Produk akan dikirim ke akun Anda setelah tahap pemrosesan selesai."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Instructions / Details */}
        {order.paymentStatus === "UNPAID" && (order.vaNumber || order.qrString) && (
          <div className="bg-gaming-card rounded-2xl border border-white/5 p-6 mb-6">
            <h2 className="text-white font-semibold mb-4 text-center">Instruksi Pembayaran</h2>
            {order.vaNumber && (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Nomor Virtual Account:</p>
                <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono text-purple-400 font-bold tracking-wider">{order.vaNumber}</span>
                </div>
                <p className="text-gray-500 text-xs mt-3">Silakan transfer sesuai total tagihan ke nomor Virtual Account di atas.</p>
              </div>
            )}
            {order.qrString && (
              <div className="flex flex-col items-center">
                <p className="text-gray-400 text-sm mb-4">Scan QRIS ini menggunakan aplikasi E-Wallet/M-Banking Anda:</p>
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG value={order.qrString} size={200} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Details */}
        <div className="bg-gaming-card rounded-2xl border border-white/5 p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Detail Pesanan</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Game</span>
              <span className="text-white">{order.gameName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ID Akun</span>
              <span className="text-white font-mono">{order.gameUserId}</span>
            </div>
            {order.gameServerId && (
              <div className="flex justify-between">
                <span className="text-gray-400">Server ID</span>
                <span className="text-white font-mono">{order.gameServerId}</span>
              </div>
            )}
            {order.gameUsername && (
              <div className="flex justify-between">
                <span className="text-gray-400">Nama Akun (Nickname)</span>
                <span className="text-purple-400 font-bold">{order.gameUsername}</span>
              </div>
            )}
            {order.orderItems?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-400">Produk</span>
                <span className="text-white">{item.product?.name}</span>
              </div>
            ))}
            {order.ppn && order.ppn > 0 ? (
              <div className="flex justify-between">
                <span className="text-gray-400">PPN (11%)</span>
                <span className="text-white">{formatCurrency(order.ppn)}</span>
              </div>
            ) : null}
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-gray-300 font-medium">Total Bayar</span>
              <span className="text-purple-400 font-bold">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-gaming-card rounded-2xl border border-white/5 p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Data Pembeli</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Nama</span>
              <span className="text-white">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{order.customerEmail}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-gaming-card rounded-xl border border-white/5 p-4 mb-6">
            <p className="text-gray-400 text-sm">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" size="md" onClick={handleRefresh} loading={refreshing} className="flex-1">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {order.paymentStatus === "UNPAID" && order.paymentUrl && !order.qrString && !order.vaNumber && (
            <a href={order.paymentUrl} className="flex-1">
              <Button variant="primary" size="md" className="w-full">
                Bayar Sekarang
              </Button>
            </a>
          )}
          <Link href="/" className="flex-1">
            <Button variant="secondary" size="md" className="w-full">
              <Home className="w-4 h-4" />
              Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
