"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Gamepad2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState("Gamerstore");
  const [siteLogo, setSiteLogo] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.siteName) setSiteName(data.data.siteName);
          if (data.data.siteLogo) setSiteLogo(data.data.siteLogo);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Kode OTP telah dikirim ke email Anda");
        // Redirect to reset password page with email as query param
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data.error || "Gagal mengirim permintaan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="w-10 h-10 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
            )}
            <span className="text-slate-900 dark:text-white font-extrabold text-xl tracking-tight">
              {siteName}
            </span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Lupa Password</h1>
          <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
            Masukkan email Anda dan kami akan mengirimkan instruksi untuk mereset password.
          </p>
        </div>

        <div className="bg-white dark:bg-gaming-card rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-xl shadow-slate-900/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email terdaftar"
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Kirim Kode OTP
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-purple-400 hover:underline font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
