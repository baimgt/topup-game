"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Users, Gamepad2, Package,
  Settings, Menu, X, Gamepad, LogOut, ChevronRight, Bell, CreditCard, ArrowUpRight, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Transaksi", icon: ShoppingBag },
  { href: "/admin/users", label: "Data User", icon: Users },
  { href: "/admin/games", label: "Data Game", icon: Gamepad2 },
  { href: "/admin/products", label: "Data Produk", icon: Package },
  { href: "/admin/payment", label: "Payment Gateway", icon: CreditCard },
  { href: "/admin/marketing", label: "Promosi", icon: Sparkles },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/");
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden relative selection:bg-purple-500/30">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-cyan-600/10 blur-[100px]" />
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "relative z-20 flex flex-col bg-white/[0.02] backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex-shrink-0 shadow-2xl shadow-black/50",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-20 border-b border-white/5">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
            <Gamepad className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-white font-black text-lg tracking-wide truncate">
              Game<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">TopUp</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 space-y-1.5 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  active
                    ? "bg-purple-500/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-purple-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-400 to-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                )}
                <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110", active ? "text-purple-400" : "text-gray-500 group-hover:text-cyan-400")} />
                {sidebarOpen && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 p-4 bg-black/20">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20 border border-white/10">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{user?.name || "Admin"}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-gray-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Topbar */}
        <header className="h-20 bg-white/[0.01] backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-all hover:bg-white/5 p-2 rounded-xl"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs font-medium transition-colors border border-purple-500/20">
              Lihat Website <ArrowUpRight className="w-3 h-3" />
            </Link>
            <button className="relative text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-gaming-dark"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
