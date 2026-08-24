"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Gamepad2, ShoppingBag, LogOut, LayoutDashboard, Home, Search, Trophy, Sparkles, User as UserIcon } from "lucide-react";
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
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
    >
      <motion.div style={{ paddingBottom: navPadding, paddingTop: navPadding }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="w-10 h-10 object-contain rounded-xl shadow-[0_0_20px_rgba(157,78,221,0.5)] group-hover:scale-105 transition-transform" />
            ) : (
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(157,78,221,0.5)]"
              >
                <Gamepad2 className="w-6 h-6 text-white" />
              </motion.div>
            )}
            <span className="text-white font-extrabold text-xl tracking-tight flex items-center gap-1">
              {siteName.substring(0, 4)}<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{siteName.substring(4) || "Store"}</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse opacity-80" />
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group py-1">
              Beranda
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
            <Link href="/games" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group py-1">
              Semua Game
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
            <Link href="/order/check" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group py-1">
              Cek Pesanan
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
            <Link href="/leaderboard" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group py-1">
              Leaderboard
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-purple-500/20 text-purple-300">
                      <LayoutDashboard className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="rounded-full hover:bg-cyan-500/20 text-cyan-300">
                    <ShoppingBag className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/profile">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 text-sm text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer pr-4 pl-1.5 py-1.5 rounded-full border border-white/10 shadow-lg"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md shadow-purple-500/30">
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
                  <Button variant="primary" size="sm" className="rounded-full px-6 shadow-md shadow-indigo-500/20">Daftar</Button>
                </Link>
              </>
            )}
          </div>

          {/* Ultra-Smooth Animated Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden relative w-11 h-11 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border ${
              isOpen 
                ? "bg-gradient-to-br from-purple-600/30 to-cyan-600/30 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                : "bg-white/[0.06] hover:bg-white/[0.12] border-white/10 shadow-md"
            }`}
            aria-label="Toggle navigation menu"
          >
            {/* Top Bar */}
            <motion.span
              animate={isOpen ? { rotate: 45, y: 7.5, width: 22 } : { rotate: 0, y: 0, width: 22 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="h-[2.5px] bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full origin-center shadow-sm"
            />
            {/* Middle Bar */}
            <motion.span
              animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1, width: 16 }}
              transition={{ duration: 0.2 }}
              className="h-[2.5px] bg-cyan-400 rounded-full shadow-sm"
            />
            {/* Bottom Bar */}
            <motion.span
              animate={isOpen ? { rotate: -45, y: -7.5, width: 22 } : { rotate: 0, y: 0, width: 22 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="h-[2.5px] bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full origin-center shadow-sm"
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Ultra-Smooth Glassmorphic Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="md:hidden bg-[#09051d]/95 backdrop-blur-2xl border-b border-purple-500/20 shadow-[0_25px_50px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-2">
              
              {/* Navigation Links with Icons */}
              <Link 
                href="/" 
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-white hover:text-white bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.12] transition-all font-bold text-sm border border-white/5 hover:border-indigo-500/30 group shadow-sm"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform shadow-sm">
                  <Home className="w-4 h-4" />
                </div>
                <span>Beranda</span>
              </Link>

              <Link 
                href="/games" 
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-white hover:text-white bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.12] transition-all font-bold text-sm border border-white/5 hover:border-purple-500/30 group shadow-sm"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform shadow-sm">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <span>Semua Game</span>
              </Link>

              <Link 
                href="/order/check" 
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-white hover:text-white bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.12] transition-all font-bold text-sm border border-white/5 hover:border-cyan-500/30 group shadow-sm"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform shadow-sm">
                  <Search className="w-4 h-4" />
                </div>
                <span>Cek Status Pesanan</span>
              </Link>

              <Link 
                href="/leaderboard" 
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-white hover:text-white bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.12] transition-all font-bold text-sm border border-white/5 hover:border-yellow-500/30 group shadow-sm"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-300 group-hover:scale-110 transition-transform shadow-sm">
                  <Trophy className="w-4 h-4" />
                </div>
                <span>Leaderboard Top Spender</span>
              </Link>
              
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-3" />
              
              {/* User Account / Auth Area */}
              {user ? (
                <div className="space-y-1.5 pt-1">
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-white hover:text-white bg-white/[0.06] hover:bg-white/[0.10] transition-all border border-white/10 shadow-sm" 
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-md">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-[11px] text-gray-300">{user.email}</p>
                    </div>
                  </Link>

                  <Link 
                    href="/orders" 
                    className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-gray-200 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-semibold" 
                    onClick={() => setIsOpen(false)}
                  >
                    <ShoppingBag className="w-4 h-4 text-cyan-400" /> Riwayat Pesanan
                  </Link>

                  {user.role === "ADMIN" && (
                    <Link 
                      href="/admin" 
                      className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 transition-all text-sm font-bold" 
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard Admin
                    </Link>
                  )}

                  <button 
                    onClick={() => { logout(); setIsOpen(false); }} 
                    className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-semibold w-full text-left"
                  >
                    <LogOut className="w-4 h-4" /> Keluar dari Akun
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)} className="block">
                    <button className="w-full rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-sm font-bold py-2.5 transition-all active:scale-95 shadow-sm">
                      Masuk
                    </button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsOpen(false)} className="block">
                    <button className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white text-sm font-bold py-2.5 transition-all active:scale-95 shadow-lg shadow-indigo-500/30">
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

