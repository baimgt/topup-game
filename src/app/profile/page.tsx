"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Mail, Lock, Save, ShoppingBag, CheckCircle,
  TrendingUp, Eye, EyeOff, Shield, LogOut, ChevronRight,
  Medal, Award, Crown, Diamond
} from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";

interface Profile {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  successCount: number;
  totalSpent: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  gameName: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  orderItems: { productName: string }[];
}

type ActiveTab = "profile" | "password" | "orders";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  const [otpState, setOtpState] = useState<{ show: boolean; type: "email" | "password"; otp: string; loading: boolean }>({ show: false, type: "email", otp: "", loading: false });
  const [successModal, setSuccessModal] = useState(false);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    fetchAll(token);
  }, [router]);

  const fetchAll = async (token: string) => {
    setLoading(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/user/orders?limit=5", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const profileData = await profileRes.json();
      const ordersData = await ordersRes.json();

      if (profileData.success) {
        setProfile(profileData.data);
        setProfileForm({ name: profileData.data.name, email: profileData.data.email, phone: profileData.data.phone || "" });
      } else {
        router.push("/auth/login");
        return;
      }

      if (ordersData.success) {
        setRecentOrders(ordersData.data.orders);
        setStats(ordersData.data.stats);
      }
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (profileForm.email !== profile?.email && !otpState.show) {
      setSavingProfile(true);
      try {
        const res = await fetch("/api/user/profile/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ type: "email" })
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Kode OTP telah dikirim ke email lama Anda");
          setOtpState({ show: true, type: "email", otp: "", loading: false });
        } else {
          toast.error(data.error || "Gagal mengirim OTP");
        }
      } catch {
        toast.error("Terjadi kesalahan server");
      } finally {
        setSavingProfile(false);
      }
      return;
    }

    setSavingProfile(true);
    try {
      const payload: any = { name: profileForm.name, phone: profileForm.phone };
      if (profileForm.email !== profile?.email) {
        payload.email = profileForm.email;
        payload.otp = otpState.otp;
      }
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profil berhasil diupdate");
        setProfile(data.data);
        setOtpState({ ...otpState, show: false, otp: "" });
        const stored = localStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored);
          localStorage.setItem("user", JSON.stringify({ ...user, name: data.data.name, email: data.data.email, phone: data.data.phone }));
        }
      } else {
        toast.error(data.error || "Gagal menyimpan");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    
    if (!otpState.show) {
      setSavingPw(true);
      try {
        const res = await fetch("/api/user/profile/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ type: "password" })
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Kode OTP telah dikirim ke email Anda");
          setOtpState({ show: true, type: "password", otp: "", loading: false });
        } else {
          toast.error(data.error || "Gagal mengirim OTP");
        }
      } catch {
        toast.error("Terjadi kesalahan server");
      } finally {
        setSavingPw(false);
      }
      return;
    }

    setSavingPw(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword, otp: otpState.otp }),
      });
      const data = await res.json();
      if (data.success) {
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setOtpState({ ...otpState, show: false, otp: "" });
        setSuccessModal(true);
      } else {
        toast.error(data.error || "Gagal mengubah password");
      }
    } finally {
      setSavingPw(false);
    }
  };
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth_changed"));
    toast.success("Berhasil keluar");
    router.push("/");
  };



  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-purple-500/20 rounded-full blur-md" />
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Pengaturan Profil", icon: <User className="w-4 h-4" /> },
    { key: "password", label: "Keamanan", icon: <Lock className="w-4 h-4" /> },
    { key: "orders", label: "Riwayat Pesanan", icon: <ShoppingBag className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen py-12 px-4 overflow-hidden relative">
      {/* Animated BG */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay z-0 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none z-0" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column - Profile Card */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
              <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-purple-500 to-blue-500 opacity-20 group-hover:opacity-30 transition-opacity`} />
              
              <div className="relative flex flex-col items-center text-center mt-4">
                <div className="relative mb-4">
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-1 shadow-lg`}>
                    <div className="w-full h-full bg-gaming-dark rounded-full flex items-center justify-center border-[4px] border-transparent">
                      <span className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
                        {profile?.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-1">{profile?.name}</h1>
                <p className="text-gray-400 text-sm">{profile?.email}</p>
                {profile?.phone && <p className="text-gray-400 text-sm mb-4">{profile?.phone}</p>}
                {!profile?.phone && <p className="text-gray-400 text-sm mb-4">No. HP belum diatur</p>}
                
                {profile?.role === "ADMIN" && (
                  <div className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-3 py-1 rounded-full flex items-center gap-1 mb-4">
                    <Shield className="w-3 h-3" /> Administrator
                  </div>
                )}
                
                <p className="text-gray-500 text-xs mb-6 bg-white/5 px-4 py-2 rounded-xl">
                  Bergabung {new Date(profile?.createdAt || "").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                </p>

                <div className="w-full grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                  <div className="bg-white/5 rounded-xl p-3 text-left">
                    <div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Transaksi</div>
                    <div className="text-white font-bold text-lg">{stats?.totalOrders || 0}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-left">
                    <div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Pengeluaran</div>
                    <div className="text-white font-bold text-sm truncate">{formatCurrency(stats?.totalSpent || 0)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className="glass-panel rounded-3xl p-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all relative overflow-hidden ${
                    activeTab === tab.key ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {activeTab === tab.key && (
                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10" initial={false} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-3 w-full">
                    <span className={activeTab === tab.key ? "text-purple-400" : ""}>{tab.icon}</span>
                    {tab.label}
                    {activeTab === tab.key && <ChevronRight className="w-4 h-4 ml-auto text-purple-400" />}
                  </span>
                </button>
              ))}

              {profile?.role === "ADMIN" && (
                <Link href="/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-all mt-2 border border-purple-500/20">
                  <Shield className="w-4 h-4" />
                  Admin Panel
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>
              )}
              
              <div className="pt-2 mt-2 border-t border-white/5">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut className="w-4 h-4" />
                  Keluar Akun
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-3xl p-6 md:p-8 min-h-[600px] relative">
              <AnimatePresence mode="wait">
                
                {/* ── Tab: Profil ── */}
                {activeTab === "profile" && (
                  <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Informasi Profil</h2>
                      <p className="text-gray-400 text-sm">Kelola informasi data diri dan kontak Anda di sini.</p>
                    </div>
                    
                    <div className="space-y-5 bg-black/20 p-6 rounded-2xl border border-white/5">
                      <Input
                        label="Nama Lengkap"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        icon={<User className="w-5 h-5" />}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        icon={<Mail className="w-5 h-5" />}
                      />
                      <Input
                        label="Nomor WhatsApp"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, "") })}
                        icon={<span className="font-bold text-gray-400 text-sm">#</span>}
                      />
                      
                      <div className="pt-4 flex justify-end">
                        <Button
                          variant="primary"
                          loading={savingProfile}
                          onClick={handleSaveProfile}
                          disabled={profileForm.name === profile?.name && profileForm.email === profile?.email && profileForm.phone === (profile?.phone || "")}
                          className="px-8"
                        >
                          <Save className="w-4 h-4" /> Simpan Perubahan
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Tab: Password ── */}
                {activeTab === "password" && (
                  <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Keamanan Akun</h2>
                      <p className="text-gray-400 text-sm">Pastikan akun Anda tetap aman dengan menggunakan password yang kuat.</p>
                    </div>
                    
                    <div className="space-y-5 bg-black/20 p-6 rounded-2xl border border-white/5">
                      <div className="relative">
                        <Input
                          label="Password Saat Ini"
                          type={showPw.current ? "text" : "password"}
                          value={pwForm.currentPassword}
                          onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                          icon={<Lock className="w-5 h-5" />}
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPw({ ...showPw, current: !showPw.current })} className="absolute right-4 top-10 text-gray-500 hover:text-gray-300 transition-colors">
                          {showPw.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          label="Password Baru"
                          type={showPw.new ? "text" : "password"}
                          value={pwForm.newPassword}
                          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                          icon={<Lock className="w-5 h-5" />}
                          placeholder="Min. 6 karakter"
                        />
                        <button type="button" onClick={() => setShowPw({ ...showPw, new: !showPw.new })} className="absolute right-4 top-10 text-gray-500 hover:text-gray-300 transition-colors">
                          {showPw.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          label="Konfirmasi Password Baru"
                          type={showPw.confirm ? "text" : "password"}
                          value={pwForm.confirmPassword}
                          onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                          icon={<Lock className="w-5 h-5" />}
                          placeholder="••••••••"
                          error={pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? "Password tidak cocok" : undefined}
                        />
                        <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} className="absolute right-4 top-10 text-gray-500 hover:text-gray-300 transition-colors">
                          {showPw.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button
                          variant="primary"
                          loading={savingPw}
                          onClick={handleChangePassword}
                          disabled={!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                          className="px-8"
                        >
                          <Lock className="w-4 h-4" /> Ubah Password
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Tab: Pesanan Terakhir ── */}
                {activeTab === "orders" && (
                  <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Riwayat Pesanan</h2>
                        <p className="text-gray-400 text-sm">Menampilkan 5 pesanan terakhir Anda.</p>
                      </div>
                      <Link href="/orders">
                        <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">Lihat Semua</Button>
                      </Link>
                    </div>
                    
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/10">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ShoppingBag className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">Belum ada transaksi</h3>
                        <p className="text-gray-400 text-sm mb-6">Mulai top up game favoritmu sekarang juga!</p>
                        <Link href="/games">
                          <Button variant="outline" className="rounded-full px-8">Mulai Top Up</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentOrders.map((order, idx) => (
                          <Link key={order._id} href={`/order/${order.orderNumber}`}>
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="group bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all flex items-center gap-4 cursor-pointer"
                            >
                              <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:scale-105 transition-transform">
                                <span className="text-white font-black text-xl">{order.gameName.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-1">
                                  <h4 className="text-white font-semibold truncate text-lg">{order.gameName}</h4>
                                  <div className="flex gap-2">
                                    <PaymentStatusBadge status={order.paymentStatus} />
                                    <OrderStatusBadge status={order.orderStatus} glow={order.orderStatus === "SUCCESS"} />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-gray-400 text-sm truncate max-w-[60%]">{order.orderItems[0]?.productName}</p>
                                  <p className="text-cyan-400 font-bold">{formatCurrency(order.totalAmount)}</p>
                                </div>
                                <p className="text-gray-600 text-xs mt-2">{new Date(order.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 text-gray-500 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* OTP Modal */}
      <AnimatePresence>
        {otpState.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl w-full max-w-md relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-500" />
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Verifikasi OTP</h3>
                <p className="text-gray-400 text-sm">
                  Masukkan kode 6 digit yang telah dikirim ke email Anda untuk memverifikasi perubahan {otpState.type === "email" ? "email" : "password"}.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Kode OTP"
                  placeholder="Contoh: 123456"
                  maxLength={6}
                  value={otpState.otp}
                  onChange={(e) => setOtpState({ ...otpState, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                />
                
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOtpState({ ...otpState, show: false, otp: "" })}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={otpState.otp.length !== 6 || savingProfile || savingPw}
                    loading={savingProfile || savingPw}
                    onClick={otpState.type === "email" ? handleSaveProfile : handleChangePassword}
                  >
                    Verifikasi
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Success Modal */}
      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl w-full max-w-sm text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
              
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-500/30">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Berhasil!</h3>
              <p className="text-gray-400 text-sm mb-8">
                Password Anda telah berhasil diubah. Gunakan password baru Anda untuk login selanjutnya.
              </p>
              
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setSuccessModal(false)}
              >
                Tutup
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
