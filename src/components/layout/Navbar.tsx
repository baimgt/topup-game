"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Gamepad2, Menu, X, ShoppingBag, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { scrollY } = useScroll();
  const [siteName, setSiteName] = useState("GameTopUp");
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
    ["rgba(9, 9, 11, 0.95)", "rgba(9, 9, 11, 0.95)"]
  );
  
  const navBorder = useTransform(
    scrollY,
    [0, 50],
    ["rgba(255, 255, 255, 0.04)", "rgba(255, 255, 255, 0.08)"]
  );
  
  const navPadding = useTransform(
    scrollY,
    [0, 50],
    ["1.5rem", "0.75rem"]
  );

  return (
    <motion.nav 
      style={{ background: navBackground, borderColor: navBorder }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all"
    >
      <motion.div style={{ paddingBottom: navPadding, paddingTop: navPadding }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="w-10 h-10 object-contain rounded-xl shadow-[0_0_15px_rgba(157,78,221,0.5)]" />
            ) : (
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(157,78,221,0.5)]"
              >
                <Gamepad2 className="w-6 h-6 text-white" />
              </motion.div>
            )}
            <span className="text-white font-extrabold text-xl tracking-tight">
              {siteName.substring(0, 4)}<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{siteName.substring(4) || "Store"}</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group">
              Beranda
              <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all group-hover:w-full rounded-full" />
            </Link>
            <Link href="/games" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group">
              Semua Game
              <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all group-hover:w-full rounded-full" />
            </Link>
            <Link href="/order/check" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group">
              Cek Pesanan
              <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all group-hover:w-full rounded-full" />
            </Link>
            <Link href="/leaderboard" className="relative text-gray-300 hover:text-white font-medium text-sm transition-colors group">
              Leaderboard
              <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all group-hover:w-full rounded-full" />
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <LayoutDashboard className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <ShoppingBag className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/profile">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 text-sm text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer pr-4 pl-1.5 py-1.5 rounded-full border border-white/5 shadow-inner"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </motion.div>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Masuk</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm" className="rounded-full px-6">Daftar</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gaming-card/95 backdrop-blur-xl border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <Link href="/" className="block text-gray-300 hover:text-white font-medium" onClick={() => setIsOpen(false)}>
                Beranda
              </Link>
              <Link href="/games" className="block text-gray-300 hover:text-white font-medium" onClick={() => setIsOpen(false)}>
                Semua Game
              </Link>
              <Link href="/order/check" className="block text-gray-300 hover:text-white font-medium" onClick={() => setIsOpen(false)}>
                Cek Pesanan
              </Link>
              <Link href="/leaderboard" className="block text-gray-300 hover:text-white font-medium" onClick={() => setIsOpen(false)}>
                Leaderboard
              </Link>
              
              <div className="h-px bg-white/10 my-4" />
              
              {user ? (
                <>
                  <Link href="/orders" className="flex items-center gap-2 text-gray-300 hover:text-white font-medium" onClick={() => setIsOpen(false)}>
                    <ShoppingBag className="w-4 h-4" /> Pesanan Saya
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white font-medium" onClick={() => setIsOpen(false)}>
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    Profil Saya
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium" onClick={() => setIsOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                    </Link>
                  )}
                  <button onClick={() => { logout(); setIsOpen(false); }} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-medium w-full text-left mt-4">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">Masuk</Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                    <Button variant="primary" className="w-full">Daftar</Button>
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
