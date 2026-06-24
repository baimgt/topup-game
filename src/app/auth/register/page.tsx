"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, Gamepad2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import Modal from "@/components/ui/Modal";

function RegisterForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const nameParam = searchParams.get("name") || "";
  const isGoogleParam = searchParams.get("google") === "true";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGoogleRegister, setIsGoogleRegister] = useState(false);
  const { loginWithGoogle } = useAuth();
  const router = useRouter();

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (nameParam) setName(nameParam);
    if (isGoogleParam) setIsGoogleRegister(true);
  }, [emailParam, nameParam, isGoogleParam]);

  // Countdown timer for OTP resending
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isGoogleRegister) {
        // Direct register for Google users (bypass OTP)
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password, isGoogle: true }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        // Auto-login after registration
        localStorage.setItem("user", JSON.stringify(data.data.user));
        localStorage.setItem("token", data.data.token);
        
        toast.success("Registrasi Google berhasil!");
        window.location.href = "/";
      } else {
        // Manual registration - send OTP
        const res = await fetch("/api/auth/register/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        toast.success("Kode OTP telah dikirim ke email Anda!");
        setShowOtpModal(true);
        setCountdown(60);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Kode OTP baru telah dikirim!");
      setCountdown(60);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim ulang OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Kode OTP harus 6 digit");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Auto-login
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("token", data.data.token);

      toast.success("Verifikasi berhasil! Akun Anda aktif.");
      setShowOtpModal(false);
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.message || "Verifikasi OTP gagal");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    try {
      const data = await loginWithGoogle(credential);
      if (data.exists) {
        toast.success("Akun sudah terdaftar. Berhasil masuk!");
        router.push("/");
      } else {
        toast.success("Google terverifikasi, silakan lengkapi pendaftaran!");
        setEmail(data.email);
        setName(data.name);
        setIsGoogleRegister(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal masuk dengan Google");
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
          <h1 className="text-2xl font-bold text-white mb-2">Buat Akun Baru</h1>
          <p className="text-gray-400 text-sm">
            {isGoogleRegister 
              ? "Lengkapi kata sandi untuk mengaktifkan login manual."
              : "Daftar dan mulai top up game favoritmu"}
          </p>
        </div>

        <div className="bg-gaming-card rounded-2xl border border-white/5 p-6 relative">
          {isGoogleRegister && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-t-2xl" />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
              disabled={isGoogleRegister}
            />
            <div className="relative">
              <Input
                label="Email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
                disabled={isGoogleRegister}
              />
              {isGoogleRegister && (
                <span className="absolute right-3 top-[38px] text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Terverifikasi Google
                </span>
              )}
            </div>
            <Input
              label="Nomor WhatsApp"
              type="tel"
              placeholder="081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              icon={<span className="font-bold text-gray-400 text-sm">#</span>}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              {isGoogleRegister ? "Selesaikan Pendaftaran" : "Daftar Sekarang"}
            </Button>
          </form>

          {!isGoogleRegister && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gaming-card px-2 text-gray-400">Atau daftar dengan</span>
                </div>
              </div>

              <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={(err) => toast.error(err)} />
            </>
          )}

          <p className="text-center text-gray-400 text-sm mt-6">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      {/* Modal OTP */}
      <Modal open={showOtpModal} onClose={() => setShowOtpModal(false)} title="Verifikasi Akun Anda" size="sm">
        <div className="text-center pb-2">
          <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/5">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Masukkan Kode OTP</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Kode verifikasi telah dikirim ke <span className="text-cyan-400 font-medium font-mono">{email}</span>. Berlaku selama 10 menit.
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              label="Kode OTP 6-Digit"
              placeholder="Contoh: 123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
              className="text-center font-mono text-xl tracking-[0.5em] focus:tracking-[0.5em]"
            />

            <Button type="submit" variant="primary" loading={otpLoading} className="w-full">
              Verifikasi & Aktivasi
            </Button>
          </form>

          <div className="mt-6 text-sm">
            {countdown > 0 ? (
              <p className="text-gray-500">
                Kirim ulang OTP dalam <span className="text-purple-400 font-mono font-medium">{countdown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
              >
                Kirim Ulang Kode OTP
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
