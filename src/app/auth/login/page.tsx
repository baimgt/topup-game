"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Gamepad2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState("Gamerstore");
  const [siteLogo, setSiteLogo] = useState("");
  const { login, loginWithGoogle } = useAuth();
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
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Berhasil masuk!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    try {
      const data = await loginWithGoogle(credential);
      if (data.exists) {
        toast.success("Berhasil masuk dengan Google!");
        router.push("/");
      } else {
        toast.success("Google terverifikasi, silakan lengkapi pendaftaran!");
        router.push(`/auth/register?email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}&google=true`);
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Masuk ke Akun</h1>
          <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">Selamat datang kembali!</p>
        </div>

        <div className="bg-white dark:bg-gaming-card rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-xl shadow-slate-900/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />
            <div className="flex justify-end mt-[-8px]">
              <Link href="/auth/forgot-password" className="text-xs text-indigo-600 dark:text-purple-400 hover:underline font-semibold">
                Lupa Password?
              </Link>
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Masuk
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gaming-card px-2 text-slate-500 dark:text-gray-400 font-semibold">Atau masuk dengan</span>
            </div>
          </div>

          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={(err) => toast.error(err)} />

          <p className="text-center text-slate-600 dark:text-gray-400 text-sm mt-6 font-medium">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="text-indigo-600 dark:text-purple-400 hover:underline font-bold">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
