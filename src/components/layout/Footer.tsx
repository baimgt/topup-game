"use client";

import Link from "next/link";
import { Gamepad2, Instagram, Phone, Mail, MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Footer() {
  const [siteName, setSiteName] = useState("GameTopUp");
  const [siteLogo, setSiteLogo] = useState("");
  const [siteDesc, setSiteDesc] = useState("Platform top up game terpercaya dengan proses cepat, aman, dan harga terbaik.");
  const [whatsappNumber, setWhatsappNumber] = useState("6281234567890");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com/gametopup");
  const [contactEmail, setContactEmail] = useState("support@gametopup.com");
  const [contactPhone, setContactPhone] = useState("+62 812-3456-7890");

  const [activeModal, setActiveModal] = useState<"faq" | "contact" | "terms" | "privacy" | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.siteName) setSiteName(data.data.siteName);
          if (data.data.siteLogo) setSiteLogo(data.data.siteLogo);
          if (data.data.siteDescription) setSiteDesc(data.data.siteDescription);
          if (data.data.whatsappNumber) setWhatsappNumber(data.data.whatsappNumber);
          if (data.data.instagramUrl) setInstagramUrl(data.data.instagramUrl);
          if (data.data.contactEmail) setContactEmail(data.data.contactEmail);
          if (data.data.contactPhone) setContactPhone(data.data.contactPhone);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <footer className="bg-gaming-card border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="w-8 h-8 object-contain rounded-lg" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-md">
                {siteName}
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {siteDesc}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Navigasi</h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Beranda" },
                { href: "/games", label: "Semua Game" },
                { href: "/order/check", label: "Cek Pesanan" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Bantuan</h3>
            <ul className="space-y-2">
              {[
                { id: "faq", label: "FAQ" },
                { id: "contact", label: "Hubungi Kami" },
                { id: "terms", label: "Syarat & Ketentuan" },
                { id: "privacy", label: "Kebijakan Privasi" },
              ].map((item) => (
                <li key={item.id}>
                  <button onClick={() => setActiveModal(item.id as any)} className="text-gray-400 hover:text-white text-sm transition-colors text-left w-full">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/50 flex items-center justify-center transition-all group">
                <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-green-400" />
              </a>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/50 flex items-center justify-center transition-all group">
                <Instagram className="w-4 h-4 text-gray-400 group-hover:text-pink-400" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-xs">Powered by</span>
            <span className="text-purple-400 text-xs font-medium">Digiflazz</span>
            <span className="text-gray-600">•</span>
            <span className="text-blue-400 text-xs font-medium">Baim</span>
          </div>
        </div>
      </div>
    </footer>
      
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-gaming-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h2 className="text-lg font-bold text-white">
                  {activeModal === "faq" && "Frequently Asked Questions"}
                  {activeModal === "contact" && "Hubungi Kami"}
                  {activeModal === "terms" && "Syarat & Ketentuan"}
                  {activeModal === "privacy" && "Kebijakan Privasi"}
                </h2>
                <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {activeModal === "faq" && (
                  <div className="space-y-4">
                    {[
                      { q: "Bagaimana cara melakukan top up?", a: "Pilih game yang Anda inginkan, masukkan User ID, pilih nominal top up, pilih metode pembayaran, dan selesaikan pembayaran. Saldo atau diamond akan masuk secara otomatis setelah pembayaran berhasil dikonfirmasi." },
                      { q: "Berapa lama proses top up memakan waktu?", a: "Proses top up biasanya memakan waktu 1-5 menit setelah pembayaran Anda terverifikasi oleh sistem kami." },
                      { q: "Metode pembayaran apa saja yang tersedia?", a: "Kami mendukung berbagai metode pembayaran seperti QRIS, E-Wallet (OVO, DANA, ShopeePay, LinkAja), Virtual Account berbagai Bank, serta pembayaran via minimarket." },
                      { q: "Bagaimana jika pesanan saya gagal tapi saldo terpotong?", a: "Jika status pesanan Anda Gagal namun pembayaran telah berhasil, dana akan otomatis dikembalikan atau Anda dapat menghubungi Customer Service kami dengan melampirkan Nomor Pesanan dan Bukti Pembayaran." },
                    ].map((faq, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-2">Q: {faq.q}</h4>
                        <p className="text-gray-400 text-sm">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeModal === "contact" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-6 text-center border border-white/5">
                      <Mail className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                      <h4 className="text-white font-medium mb-1">Email</h4>
                      <a href={`mailto:${contactEmail}`} className="text-blue-400 text-sm hover:underline">{contactEmail}</a>
                    </div>
                    <div className="bg-white/5 rounded-xl p-6 text-center border border-white/5">
                      <MessageCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                      <h4 className="text-white font-medium mb-1">WhatsApp</h4>
                      <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm hover:underline">Chat Sekarang</a>
                    </div>
                    <div className="bg-white/5 rounded-xl p-6 text-center border border-white/5 sm:col-span-2">
                      <Phone className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                      <h4 className="text-white font-medium mb-1">Telepon</h4>
                      <a href={`tel:${contactPhone}`} className="text-purple-400 text-sm hover:underline">{contactPhone}</a>
                    </div>
                  </div>
                )}

                {activeModal === "terms" && (
                  <div className="space-y-4 text-sm text-gray-400">
                    <p><strong className="text-white">1. Layanan Top Up:</strong> Barang/produk digital yang telah sukses terkirim tidak dapat dibatalkan atau dikembalikan (non-refundable). Kesalahan pengisian ID merupakan tanggung jawab pembeli sepenuhnya.</p>
                    <p><strong className="text-white">2. Transaksi:</strong> Setiap transaksi harus dibayar lunas sesuai dengan total tagihan dalam batas waktu yang telah ditentukan.</p>
                    <p><strong className="text-white">3. Akun:</strong> Anda bertanggung jawab menjaga kerahasiaan kata sandi Anda.</p>
                    <p><strong className="text-white">4. Perubahan:</strong> Kami berhak untuk mengubah Syarat & Ketentuan ini kapan saja tanpa pemberitahuan sebelumnya.</p>
                  </div>
                )}

                {activeModal === "privacy" && (
                  <div className="space-y-4 text-sm text-gray-400">
                    <p><strong className="text-white">1. Pengumpulan Informasi:</strong> Kami mengumpulkan informasi dasar seperti email, WhatsApp, dan ID Game yang diperlukan untuk memproses pesanan top up Anda.</p>
                    <p><strong className="text-white">2. Penggunaan Informasi:</strong> Informasi digunakan semata-mata untuk memproses transaksi dan memberikan pemberitahuan status pesanan.</p>
                    <p><strong className="text-white">3. Keamanan:</strong> Kami tidak menyimpan informasi detail pembayaran seperti nomor kartu kredit Anda (diproses oleh penyedia payment gateway).</p>
                    <p><strong className="text-white">4. Pengungkapan:</strong> Kami tidak menjual informasi pribadi Anda. Kami hanya memberikan informasi spesifik kepada mitra (midtrans, duitku, digiflazz) untuk penyelesaian transaksi.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
