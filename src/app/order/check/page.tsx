"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Sparkles } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function CheckOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError("Masukkan nomor pesanan");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/${orderNumber.trim()}`);
      const data = await res.json();

      if (data.success) {
        router.push(`/order/${orderNumber.trim()}`);
      } else {
        setError("Pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.");
      }
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay z-0 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(157,78,221,0.3)] relative"
          >
            <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse" />
            <Package className="w-10 h-10 text-white relative z-10" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-3">Cek Status Pesanan</h1>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
            Lacak transaksi Anda secara real-time. Masukkan nomor pesanan di bawah ini.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-3xl p-8"
        >
          <form onSubmit={handleCheck} className="space-y-6">
            <div className="space-y-2">
              <Input
                label="Nomor Pesanan"
                placeholder="Contoh: TXN-1234567890"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                error={error}
                className="text-lg"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full h-14 text-lg">
              <Search className="w-5 h-5" />
              Lacak Pesanan
            </Button>
          </form>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-xs mt-6 font-medium"
        >
          Nomor pesanan dikirim ke email Anda setelah transaksi dibuat
        </motion.p>
      </motion.div>
    </div>
  );
}
