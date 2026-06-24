"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Lock, Gamepad2, EyeOff, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Email tidak valid");
      return;
    }
    
    if (otp.length !== 6) {
      toast.error("OTP harus 6 digit");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Password berhasil diubah! Silakan login.");
        router.push("/auth/login");
      } else {
        toast.error(data.error || "Gagal mengubah password");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gaming-card rounded-2xl border border-white/5 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled
          className="opacity-60 cursor-not-allowed"
        />
        
        <Input
          label="Kode OTP (6 digit)"
          placeholder="Masukkan kode OTP dari email"
          value={otp}
          maxLength={6}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          icon={<Shield className="w-4 h-4" />}
          required
        />
        
        <div className="relative">
          <Input
            label="Password Baru"
            type={showPw.new ? "text" : "password"}
            placeholder="Min. 6 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />
          <button type="button" onClick={() => setShowPw({ ...showPw, new: !showPw.new })} className="absolute right-4 top-10 text-gray-500 hover:text-gray-300 transition-colors">
            {showPw.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Konfirmasi Password"
            type={showPw.confirm ? "text" : "password"}
            placeholder="Ketik ulang password baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            error={confirmPassword && confirmPassword !== newPassword ? "Password tidak cocok" : undefined}
            required
          />
          <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} className="absolute right-4 top-10 text-gray-500 hover:text-gray-300 transition-colors">
            {showPw.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2" disabled={!otp || !newPassword || !confirmPassword || newPassword !== confirmPassword}>
          Ubah Password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-2xl font-bold text-white mb-2">Buat Password Baru</h1>
          <p className="text-gray-400 text-sm">
            Masukkan kode OTP yang telah dikirim ke email Anda beserta password baru.
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-gray-400 py-10">Memuat formulir...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
