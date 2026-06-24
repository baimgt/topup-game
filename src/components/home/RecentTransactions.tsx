"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle, Clock, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface RecentTransaction {
  id: string;
  customerName: string;
  gameName: string;
  productName: string;
  status: string;
  timeElapsed: string;
  gameImage: string;
}

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}



export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (!transactions.length) return null;

  return (
    <div className="w-full mt-12 mb-8 overflow-hidden">
      <div className="flex flex-col items-center justify-center mb-6">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-purple-400" />
          Transaksi Real-time
        </h3>
      </div>

      <div className="relative flex overflow-hidden group py-4 [mask-image:_linear-gradient(to_right,transparent_0,_black_64px,_black_calc(100%-64px),transparent_100%)]">
        <div className="animate-marquee flex shrink-0 gap-4 pr-4 group-hover:[animation-play-state:paused] min-w-full justify-around">
          {transactions.map((trx, index) => (
            <div
              key={`${trx.id}-${index}`}
              className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 pr-6 shrink-0 transition-colors hover:bg-white/[0.04]"
            >
              <div className="w-10 h-10 relative rounded-lg overflow-hidden shrink-0 border border-white/10">
                <Image
                  src={trx.gameImage || "https://placehold.co/100x100"}
                  alt={trx.gameName}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-white font-bold text-sm truncate">{trx.gameName}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400 shrink-0">
                    <CheckCircle className="w-3 h-3" /> Berhasil
                  </span>
                  <span className="text-gray-500 text-[10px] shrink-0">
                    • {trx.timeElapsed}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Second identical block for seamless loop */}
        <div className="animate-marquee flex shrink-0 gap-4 pr-4 group-hover:[animation-play-state:paused] min-w-full justify-around" aria-hidden="true">
          {transactions.map((trx, index) => (
            <div
              key={`dup-${trx.id}-${index}`}
              className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 pr-6 shrink-0 transition-colors hover:bg-white/[0.04]"
            >
              <div className="w-10 h-10 relative rounded-lg overflow-hidden shrink-0 border border-white/10">
                <Image
                  src={trx.gameImage || "https://placehold.co/100x100"}
                  alt={trx.gameName}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-white font-bold text-sm truncate">{trx.gameName}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400 shrink-0">
                    <CheckCircle className="w-3 h-3" /> Berhasil
                  </span>
                  <span className="text-gray-500 text-[10px] shrink-0">
                    • {trx.timeElapsed}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-2">
        <span className="text-xs text-cyan-400 flex items-center gap-1 font-medium bg-cyan-400/10 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          Live - Hover untuk memperlambat
        </span>
      </div>
    </div>
  );
}
