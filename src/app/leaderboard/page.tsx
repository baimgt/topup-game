"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Trophy, Crown, Medal, Gamepad2, ShoppingBag, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface LeaderboardUser {
  rank: number;
  name: string;
  totalSpent: number;
  orderCount: number;
  favoriteGame: string;
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all-time">("monthly");
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`);
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
        }
      } catch (err) {
        console.error("Gagal mengambil data leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [period]);

  const topThree = [
    users[0] || null, // 1st
    users[1] || null, // 2nd
    users[2] || null, // 3rd
  ];

  const listUsers = users.slice(3);

  return (
    <main className="min-h-screen text-slate-800 pt-28 pb-16 px-4 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="inline-flex p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2"
          >
            <Trophy className="w-8 h-8" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase"
          >
            Top Spender{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
              Leaderboard
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-gray-400 max-w-xl mx-auto"
          >
            Apresiasi eksklusif untuk para gamers setia. Terima kasih telah melakukan top up di platform kami!
          </motion.p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex justify-center mb-10">
          <div className="bg-slate-200/50 p-1.5 rounded-full border border-slate-200/30 flex gap-1 backdrop-blur-md">
            {(["weekly", "monthly", "all-time"] as const).map((p) => {
              const label = p === "weekly" ? "Mingguan" : p === "monthly" ? "Bulanan" : "Semua Waktu";
              const isActive = period === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all relative ${
                    isActive ? "text-white text-white-force" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePeriodTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-gray-400 text-sm animate-pulse">Memuat data peringkat...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-md">
            <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Belum Ada Transaksi</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Belum ada transaksi top-up yang terbayar untuk periode ini. Jadilah yang pertama!
            </p>
            <Link href="/games">
              <button className="mt-6 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20">
                Top Up Sekarang
              </button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Podium Top 3 */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 items-end max-w-2xl mx-auto pt-8 pb-4 relative">
              {/* Rank 2 (Left) */}
              {topThree[1] ? (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-3 flex flex-col items-center">
                    <Medal className="w-6 h-6 text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.4)] mb-1" />
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full border border-slate-300 flex items-center justify-center shadow-lg relative">
                      <span className="text-slate-800 font-black text-lg">
                        {topThree[1].name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-center px-1 mb-2">
                    <p className="text-xs md:text-sm font-bold text-slate-800 truncate max-w-[85px] md:max-w-[120px]">
                      {topThree[1].name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[85px] md:max-w-[120px] mt-0.5">
                      {topThree[1].favoriteGame}
                    </p>
                  </div>
                  <div className="w-full bg-white border-t border-x border-slate-200/60 rounded-t-2xl flex flex-col items-center justify-center p-3 h-28 md:h-36 shadow-lg">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">#2</span>
                    <span className="text-[10px] md:text-xs text-indigo-600 font-black mt-2">
                      {formatCurrency(topThree[1].totalSpent)}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="invisible" />
              )}

              {/* Rank 1 (Center) */}
              {topThree[0] ? (
                <motion.div
                  initial={{ opacity: 0, y: 70 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring" }}
                  className="flex flex-col items-center z-10"
                >
                  <div className="relative mb-3 flex flex-col items-center">
                    <Crown className="w-8 h-8 text-indigo-500 drop-shadow-[0_0_12px_rgba(99,102,241,0.4)] animate-bounce" />
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full border border-blue-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] relative">
                      <span className="text-white font-black text-xl text-white-force">
                        {topThree[0].name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-center px-1 mb-2">
                    <p className="text-sm md:text-base font-extrabold text-slate-900 truncate max-w-[100px] md:max-w-[140px]">
                      {topThree[0].name}
                    </p>
                    <p className="text-[10px] md:text-xs text-slate-500 truncate max-w-[100px] md:max-w-[140px] mt-0.5">
                      {topThree[0].favoriteGame}
                    </p>
                  </div>
                  <div className="w-full bg-gradient-to-t from-indigo-50 to-indigo-100/30 border-t border-x border-indigo-200 rounded-t-2xl flex flex-col items-center justify-center p-3 h-36 md:h-44 shadow-2xl relative">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-t-2xl blur-sm" />
                    <span className="relative z-10 text-sm text-indigo-600 font-extrabold uppercase tracking-widest">#1</span>
                    <span className="relative z-10 text-xs md:text-sm text-cyan-600 font-black mt-2">
                      {formatCurrency(topThree[0].totalSpent)}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="invisible" />
              )}

              {/* Rank 3 (Right) */}
              {topThree[2] ? (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-3 flex flex-col items-center">
                    <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] mb-1" />
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full border border-amber-300 flex items-center justify-center shadow-lg relative">
                      <span className="text-amber-800 font-black text-lg">
                        {topThree[2].name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-center px-1 mb-2">
                    <p className="text-xs md:text-sm font-bold text-slate-800 truncate max-w-[85px] md:max-w-[120px]">
                      {topThree[2].name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[85px] md:max-w-[120px] mt-0.5">
                      {topThree[2].favoriteGame}
                    </p>
                  </div>
                  <div className="w-full bg-white border-t border-x border-slate-200/60 rounded-t-2xl flex flex-col items-center justify-center p-3 h-24 md:h-32 shadow-lg">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">#3</span>
                    <span className="text-[10px] md:text-xs text-indigo-600 font-black mt-2">
                      {formatCurrency(topThree[2].totalSpent)}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="invisible" />
              )}
            </div>

            {/* Ranks 4-10 List */}
            {listUsers.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-xl">
                <div className="divide-y divide-slate-100">
                  {listUsers.map((user) => (
                    <motion.div
                      key={user.rank}
                      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.01)" }}
                      className="p-4 md:p-5 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Rank Badge */}
                        <span className="w-6 text-center text-sm font-extrabold text-slate-400">
                          {user.rank}
                        </span>

                        {/* Initial Circle */}
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-600 flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Name & Fav Game */}
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-bold text-slate-800 truncate">
                            {user.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Gamepad2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-xs text-slate-500 truncate">
                              {user.favoriteGame}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info columns */}
                      <div className="flex items-center gap-6 md:gap-10 text-right flex-shrink-0">
                        {/* Order Count */}
                        <div className="hidden sm:block">
                          <p className="text-xs text-slate-400">Total Transaksi</p>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-800">
                              {user.orderCount}
                            </span>
                          </div>
                        </div>

                        {/* Spent Amount */}
                        <div>
                          <p className="text-xs text-slate-400">Total Belanja</p>
                          <p className="text-sm font-black text-indigo-600 mt-0.5">
                            {formatCurrency(user.totalSpent)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
