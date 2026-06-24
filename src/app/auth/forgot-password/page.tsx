"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Gamepad2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">
              Game<span className="text-purple-400">TopUp</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Lupa Password</h1>
          <p className="text-gray-400 text-sm">
            Masukkan email Anda dan kami akan mengirimkan instruksi untuk mereset password.
          </p>
        </div>

        <div className="bg-gaming-card rounded-2xl border border-white/5 p-6">
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
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Halaman Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
