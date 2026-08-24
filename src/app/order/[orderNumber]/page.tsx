"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, RefreshCw, Home, Search, Copy, Check, ExternalLink, FileText, Download } from "lucide-react";
import toast from "react-hot-toast";
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
  const [copiedSn, setCopiedSn] = useState(false);

  const handleCopySn = () => {
    if (order?.sn) {
      navigator.clipboard.writeText(order.sn);
      setCopiedSn(true);
      toast.success("Kode Voucher / SN berhasil disalin!");
      setTimeout(() => setCopiedSn(false), 2000);
    }
  };

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

  useEffect(() => {
    if (order?.paymentStatus === "UNPAID" && (order as any)?.paymentToken && (order as any)?.midtransClientKey) {
      const clientKey = (order as any).midtransClientKey;
      const isProd = (order as any).midtransIsProduction;
      const snapUrl = isProd
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

      if (!document.querySelector(`script[src="${snapUrl}"]`)) {
        const script = document.createElement("script");
        script.src = snapUrl;
        script.setAttribute("data-client-key", clientKey);
        document.body.appendChild(script);
      }
    }
  }, [order]);

  const handlePayNow = () => {
    if ((order as any)?.paymentToken && typeof window !== "undefined" && (window as any).snap) {
      (window as any).snap.pay((order as any).paymentToken, {
        onSuccess: function () {
          fetchOrder();
        },
        onPending: function () {
          fetchOrder();
        },
        onError: function () {
          fetchOrder();
        },
        onClose: function () {
          fetchOrder();
        },
      });
    } else if (order?.paymentUrl) {
      window.location.href = order.paymentUrl;
    }
  };

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
                  {(order as any).isPascabayar
                    ? order.orderStatus === "SUCCESS"
                      ? "Tagihan Berhasil Dilunasi"
                      : order.orderStatus === "FAILED"
                      ? "Pembayaran Tagihan Gagal"
                      : (order.paymentStatus === "PAID" && order.orderStatus === "PROCESSING")
                      ? "Sedang Dilunasi ke Biller Resmi"
                      : "Menunggu Pelunasan"
                    : order.orderStatus === "SUCCESS"
                    ? "Top-up Berhasil Masuk"
                    : order.orderStatus === "FAILED"
                    ? "Pengiriman Saldo Gagal"
                    : (order.paymentStatus === "PAID" && order.orderStatus === "PROCESSING")
                    ? "Sedang Dikirim Ke ID Game"
                    : "Menunggu Pengiriman"}
                </p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {(order as any).isPascabayar
                    ? order.orderStatus === "SUCCESS"
                      ? "Tagihan bulanan Anda telah sukses terbayar dan lunas ke biller resmi. Struk bukti pembayaran telah diterbitkan."
                      : order.orderStatus === "FAILED"
                      ? "Pelunasan tagihan ke biller gagal. Silakan hubungi customer service."
                      : (order.paymentStatus === "PAID" && order.orderStatus === "PROCESSING")
                      ? "Pembayaran telah kami terima, sistem sedang menyelesaikan pelunasan ke biller resmi."
                      : "Tagihan akan dilunasi otomatis setelah pembayaran diverifikasi."
                    : order.orderStatus === "SUCCESS"
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
        {order.paymentStatus === "UNPAID" && (
          <div className="bg-gaming-card rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent p-6 mb-6">
            {order.paymentMethod?.toLowerCase().includes("shopee") ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center text-xl">
                      🛍️
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">Pembayaran ShopeePay</h3>
                      <p className="text-orange-400 text-xs font-semibold">Midtrans Automatic E-Wallet</p>
                    </div>
                  </div>
                  <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2.5 py-1 rounded-full font-bold">
                    ShopeePay
                  </span>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2 text-xs text-gray-300">
                  <p className="font-bold text-white text-sm flex items-center gap-1.5">
                    📱 Petunjuk Pembayaran ShopeePay:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-300 leading-relaxed">
                    <li>
                      <span className="text-white font-medium">Di Smartphone / HP:</span> Klik tombol <strong>"Bayar via ShopeePay"</strong> di bawah untuk langsung membuka aplikasi Shopee & mengonfirmasi pembayaran.
                    </li>
                    <li>
                      <span className="text-white font-medium">Di PC / Laptop:</span> Klik tombol <strong>"Bayar via ShopeePay"</strong> untuk menampilkan Kode QR ShopeePay, lalu scan dari aplikasi Shopee di HP Anda.
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handlePayNow}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3"
                  >
                    Bayar via ShopeePay
                  </Button>
                  {order.paymentUrl && (
                    <a href={order.paymentUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="secondary" size="md" className="w-full py-3">
                        Buka Shopee App
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ) : order.vaNumber || order.qrString ? (
              <div className="space-y-4">
                <h2 className="text-white font-semibold text-center">Instruksi Pembayaran</h2>
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
            ) : (
              <div className="text-center space-y-3">
                <h3 className="text-white font-bold">Selesaikan Pembayaran</h3>
                <p className="text-gray-400 text-xs">
                  Metode: <span className="text-purple-400 font-bold">{order.paymentMethod}</span>
                </p>
                <Button variant="primary" size="md" onClick={handlePayNow} className="w-full sm:w-auto px-8">
                  Bayar Sekarang
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── VOUCHER / SERIAL NUMBER (SN) / STRUK RESMI DISPLAY BOX ─────── */}
        {order.sn && (
          <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-cyan-950/60 rounded-2xl border-2 border-cyan-500/40 p-6 mb-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{(order as any).isPascabayar ? "🧾" : "🎟️"}</span>
                <div>
                  <h3 className="text-white font-black text-base tracking-wide">
                    {(order as any).isPascabayar
                      ? "NOMOR REFERENSI STRUK / BUKTI BAYAR RESMI"
                      : "SERIAL NUMBER / KODE VOUCHER DIGITAL"}
                  </h3>
                  <p className="text-cyan-300 text-xs font-semibold">
                    {(order as any).isPascabayar
                      ? "Tagihan Sah & Lunas Terverifikasi Biller"
                      : "Resmi & Siap Digunakan"}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase flex-shrink-0">
                {(order as any).isPascabayar ? "LUNAS" : "Sukses Terbit"}
              </span>
            </div>

            <div className="bg-black/70 border border-white/15 rounded-xl p-4 my-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="font-mono text-xl sm:text-2xl font-black text-yellow-400 tracking-wider break-all text-center sm:text-left select-all">
                {order.sn}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopySn}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-4 py-2.5 flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  {copiedSn ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                  {copiedSn ? "Tersalin!" : "Salin No. Ref"}
                </Button>
                {(order as any).isPascabayar && (
                  <a
                    href={(order as any).receiptUrl || `https://receipt.tagihanpulsa.com/digiflazz/${order.sn || order.digiflazzRef}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial"
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold px-4 py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Struk PDF</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed flex items-center gap-1.5 mt-2">
              <span className="text-cyan-400 font-bold">ℹ️ Info:</span> Bukti struk pembayaran ini juga telah otomatis dikirimkan ke email Anda (<strong>{order.customerEmail}</strong>).
            </p>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-gaming-card rounded-2xl border border-white/5 p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">
            {(order as any).isPascabayar ? "Detail Tagihan Pascabayar" : "Detail Pesanan"}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{(order as any).isPascabayar ? "Layanan Tagihan" : "Game"}</span>
              <span className="text-white font-bold">{order.gameName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{(order as any).isPascabayar ? "ID Pelanggan / No. Meter" : "ID Akun"}</span>
              <span className="text-white font-mono font-bold">
                {order.isVoucher || order.gameUserId === "VOUCHER" ? (
                  <span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-xs font-semibold">
                    🎟️ Voucher Digital (Tanpa Akun)
                  </span>
                ) : (
                  order.gameUserId
                )}
              </span>
            </div>
            {order.gameUsername && (
              <div className="flex justify-between">
                <span className="text-gray-400">{(order as any).isPascabayar ? "Nama Pemilik Rekening" : "Nama Akun (Nickname)"}</span>
                <span className="text-cyan-300 font-bold">{order.gameUsername}</span>
              </div>
            )}
            {(order as any).pascabayarData?.standMeter && (
              <div className="flex justify-between">
                <span className="text-gray-400">Stand Meter</span>
                <span className="text-cyan-300 font-mono font-semibold">{(order as any).pascabayarData.standMeter}</span>
              </div>
            )}
            {(order as any).pascabayarData?.period && (
              <div className="flex justify-between">
                <span className="text-gray-400">Periode Tagihan</span>
                <span className="text-white">{(order as any).pascabayarData.period}</span>
              </div>
            )}
            {(order as any).pascabayarData?.tariff && (
              <div className="flex justify-between">
                <span className="text-gray-400">Tarif / Daya</span>
                <span className="text-white">{(order as any).pascabayarData.tariff}</span>
              </div>
            )}
            {order.gameServerId && (
              <div className="flex justify-between">
                <span className="text-gray-400">Server ID</span>
                <span className="text-white font-mono">{order.gameServerId}</span>
              </div>
            )}
            {order.orderItems?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-400">Produk</span>
                <span className="text-white">{item.product?.name}</span>
              </div>
            ))}
            {order.discountAmount && order.discountAmount > 0 ? (
              <div className="flex justify-between text-emerald-400">
                <span>Diskon Promo ({order.voucherCode})</span>
                <span className="font-bold">- {formatCurrency(order.discountAmount)}</span>
              </div>
            ) : null}
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
