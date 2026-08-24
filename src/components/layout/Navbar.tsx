"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Gamepad2, ShoppingBag, LogOut, LayoutDashboard, Home, Search, Trophy, Sparkles, User as UserIcon, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { scrollY } = useScroll();
  const [siteName, setSiteName] = useState("Gamerstore");
  const [siteLogo, setSiteLogo] = useState("");

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

  // Animations based on scroll
  const navBackground = useTransform(
    scrollY,
    [0, 50],
    ["rgba(9, 9, 11, 0.92)", "rgba(8, 4, 22, 0.96)"]
  );
  
  const navBorder = useTransform(
    scrollY,
    [0, 50],
    ["rgba(255, 255, 255, 0.05)", "rgba(168, 85, 247, 0.15)"]
  );
  
  const navPadding = useTransform(
    scrollY,
    [0, 50],
    ["1.25rem", "0.75rem"]
  );

  return (
    <motion.nav 
      style={{ background: navBackground, borderColor: navBorder }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.4)]"
    >
      <motion.div style={{ paddingBottom: navPadding, paddingTop: navPadding }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo & Clean Site Name */}
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="w-10 h-10 object-contain rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform" />
            ) : (
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]"
              >
                <Gamepad2 className="w-6 h-6 text-white" />
              </motion.div>
            )}
            <span className="text-white font-extrabold text-xl tracking-tight">
              {siteName}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group py-1">
              Beranda
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
            <Link href="/games" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group py-1">
              Semua Game
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
            <Link href="/tagihan" className="relative text-cyan-300 hover:text-cyan-200 font-semibold text-sm transition-colors group py-1 flex items-center gap-1.5">
              <span>⚡ Bayar Tagihan</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
            <Link href="/order/check" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group py-1">
              Cek Pesanan
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
            <Link href="/leaderboard" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group py-1">
              Leaderboard
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-gray-300 hover:text-white">
                      <LayoutDashboard className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-gray-300 hover:text-white">
                    <ShoppingBag className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/profile">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 text-sm text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer pr-4 pl-1.5 py-1.5 rounded-full border border-white/10 shadow-lg"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">{user.name?.charAt(0).toUpperCase() || "U"}</span>
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </motion.div>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="rounded-full text-gray-300 hover:text-white">Masuk</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm" className="rounded-full px-6 shadow-md shadow-indigo-600/25">Daftar</Button>
                </Link>
              </>
            )}
          </div>

          {/* Ultra-Aesthetic Animated Mobile Hamburger Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden relative w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-[5px] transition-all duration-300 border shadow-md ${
              isOpen 
                ? "bg-gradient-to-br from-indigo-600 to-violet-600 border-indigo-400 shadow-[0_0_16px_rgba(99,102,241,0.5)]" 
                : "bg-slate-900/90 hover:bg-slate-900 border-slate-700/60 shadow-slate-950/20"
            }`}
            aria-label="Toggle navigation menu"
          >
            {/* Top Bar */}
            <motion.span
              animate={isOpen ? { rotate: 45, y: 7, width: 20, backgroundColor: "#ffffff" } : { rotate: 0, y: 0, width: 20, backgroundColor: "#ffffff" }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="h-[2px] rounded-full origin-center shadow-sm"
            />
            {/* Middle Bar */}
            <motion.span
              animate={isOpen ? { opacity: 0, scaleX: 0, x: 8 } : { opacity: 1, scaleX: 1, x: 0, width: 14, backgroundColor: "#818cf8" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-[2px] rounded-full shadow-sm self-start ml-[10px]"
            />
            {/* Bottom Bar */}
            <motion.span
              animate={isOpen ? { rotate: -45, y: -7, width: 20, backgroundColor: "#ffffff" } : { rotate: 0, y: 0, width: 20, backgroundColor: "#ffffff" }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="h-[2px] rounded-full origin-center shadow-sm"
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Clean Glassmorphic Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="md:hidden mobile-nav-drawer bg-[#09090b]/98 backdrop-blur-2xl border-b border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-1.5">
              
              {/* Navigation Links */}
              <Link 
                href="/" 
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-200 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-all font-semibold text-sm group"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg nav-icon-box bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-indigo-600/30 group-hover:border-indigo-500/40 transition-colors">
                  <Home className="w-4 h-4" />
                </div>
                <span>Beranda</span>
              </Link>

              <Link 
                href="/games" 
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-200 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-all font-semibold text-sm group"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg nav-icon-box bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-indigo-600/30 group-hover:border-indigo-500/40 transition-colors">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <span>Semua Game</span>
              </Link>

              <Link 
                href="/tagihan" 
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 active:bg-cyan-500/20 transition-all font-semibold text-sm group border border-cyan-500/20"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg nav-icon-box bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:text-white group-hover:bg-cyan-600/40 transition-colors">
                  <Zap className="w-4 h-4" />
                </div>
                <span>⚡ Bayar Tagihan (PPOB)</span>
              </Link>

              <Link 
                href="/order/check" 
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-200 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-all font-semibold text-sm group"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg nav-icon-box bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-indigo-600/30 group-hover:border-indigo-500/40 transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <span>Cek Pesanan</span>
              </Link>

              <Link 
                href="/leaderboard" 
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-200 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-all font-semibold text-sm group"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg nav-icon-box bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-indigo-600/30 group-hover:border-indigo-500/40 transition-colors">
                  <Trophy className="w-4 h-4" />
                </div>
                <span>Leaderboard</span>
              </Link>
              
              <div className="h-px bg-white/10 my-3" />
              
              {/* User Account / Auth Area */}
              {user ? (
                <div className="space-y-1.5 pt-1">
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white bg-white/[0.05] hover:bg-white/[0.08] transition-all border border-white/10" 
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-md">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                      <p className="text-[11px] text-gray-400 leading-tight">{user.email}</p>
                    </div>
                  </Link>

                  <Link 
                    href="/orders" 
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium" 
                    onClick={() => setIsOpen(false)}
                  >
                    <ShoppingBag className="w-4 h-4 text-gray-400" /> Riwayat Pesanan
                  </Link>

                  {user.role === "ADMIN" && (
                    <Link 
                      href="/admin" 
                      className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all text-sm font-semibold" 
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                    </Link>
                  )}

                  <button 
                    onClick={() => { logout(); setIsOpen(false); }} 
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium w-full text-left"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)} className="block">
                    <button className="btn-login-outline w-full rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-bold py-2.5 transition-all active:scale-95">
                      Masuk
                    </button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsOpen(false)} className="block">
                    <button className="btn-register-primary w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2.5 transition-all active:scale-95 shadow-lg shadow-indigo-600/30">
                      Daftar
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

