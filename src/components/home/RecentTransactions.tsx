"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { CheckCircle, Flame } from "lucide-react";

interface RecentTransaction {
  id: string;
  customerName: string;
  gameName: string;
  productName: string;
  status: string;
  timeElapsed: string;
  gameImage: string;
  isDummy?: boolean;
}

// Data dummy yang realistis — dipakai saat data real belum cukup
const DUMMY_TRANSACTIONS: RecentTransaction[] = [
  { id: "d1", customerName: "Rafi***", gameName: "Mobile Legends", productName: "86 Diamonds", status: "SUCCESS", timeElapsed: "2 menit lalu", gameImage: "https://placehold.co/100x100/7c3aed/white?text=ML", isDummy: true },
  { id: "d2", customerName: "Siti***", gameName: "Free Fire", productName: "Weekly Pass", status: "SUCCESS", timeElapsed: "5 menit lalu", gameImage: "https://placehold.co/100x100/ef4444/white?text=FF", isDummy: true },
  { id: "d3", customerName: "Budi***", gameName: "Genshin Impact", productName: "60 Primogems", status: "SUCCESS", timeElapsed: "7 menit lalu", gameImage: "https://placehold.co/100x100/3b82f6/white?text=GI", isDummy: true },
  { id: "d4", customerName: "Andi***", gameName: "PUBG Mobile", productName: "60 UC", status: "SUCCESS", timeElapsed: "12 menit lalu", gameImage: "https://placehold.co/100x100/f59e0b/white?text=PB", isDummy: true },
  { id: "d5", customerName: "Dewi***", gameName: "Valorant", productName: "VP 300", status: "SUCCESS", timeElapsed: "15 menit lalu", gameImage: "https://placehold.co/100x100/ec4899/white?text=VL", isDummy: true },
  { id: "d6", customerName: "Hendra***", gameName: "Honor of Kings", productName: "Token 66", status: "SUCCESS", timeElapsed: "18 menit lalu", gameImage: "https://placehold.co/100x100/8b5cf6/white?text=HK", isDummy: true },
  { id: "d7", customerName: "Putri***", gameName: "Wuthering Waves", productName: "Lunite 300", status: "SUCCESS", timeElapsed: "21 menit lalu", gameImage: "https://placehold.co/100x100/06b6d4/white?text=WW", isDummy: true },
  { id: "d8", customerName: "Fajar***", gameName: "Call of Duty", productName: "CP 400", status: "SUCCESS", timeElapsed: "25 menit lalu", gameImage: "https://placehold.co/100x100/6b7280/white?text=CoD", isDummy: true },
  { id: "d9", customerName: "Maya***", gameName: "Zenless Zone Zero", productName: "Monochrome 300", status: "SUCCESS", timeElapsed: "28 menit lalu", gameImage: "https://placehold.co/100x100/10b981/white?text=ZZZ", isDummy: true },
  { id: "d10", customerName: "Kevin***", gameName: "League of Legends", productName: "Riot Points 500", status: "SUCCESS", timeElapsed: "33 menit lalu", gameImage: "https://placehold.co/100x100/f97316/white?text=LoL", isDummy: true },
  { id: "d11", customerName: "Yuni***", gameName: "FC Mobile", productName: "FC Points 200", status: "SUCCESS", timeElapsed: "36 menit lalu", gameImage: "https://placehold.co/100x100/22c55e/white?text=FC", isDummy: true },
  { id: "d12", customerName: "Rizal***", gameName: "Tower of Fantasy", productName: "Tanium 500", status: "SUCCESS", timeElapsed: "40 menit lalu", gameImage: "https://placehold.co/100x100/a855f7/white?text=ToF", isDummy: true },
];

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [displayList, setDisplayList] = useState<RecentTransaction[]>([]);
  const replaceIndexRef = useRef(0);

  useEffect(() => {
    // Start with dummy data as baseline
    const initial = [...DUMMY_TRANSACTIONS];

    // Replace dummy entries one-by-one with real transactions from the start
    const realCount = Math.min(transactions.length, DUMMY_TRANSACTIONS.length);
    for (let i = 0; i < realCount; i++) {
      initial[i] = { ...transactions[i], isDummy: false };
    }

    // If real transactions exceed dummy count, append the rest
    if (transactions.length > DUMMY_TRANSACTIONS.length) {
      const extra = transactions.slice(DUMMY_TRANSACTIONS.length).map(t => ({ ...t, isDummy: false }));
      initial.push(...extra);
    }

    setDisplayList(initial);
    replaceIndexRef.current = realCount;
  }, [transactions]);

  if (!displayList.length) return null;

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
          {displayList.map((trx, index) => (
            <TransactionCard key={`${trx.id}-${index}`} trx={trx} />
          ))}
        </div>

        {/* Second identical block for seamless loop */}
        <div className="animate-marquee flex shrink-0 gap-4 pr-4 group-hover:[animation-play-state:paused] min-w-full justify-around" aria-hidden="true">
          {displayList.map((trx, index) => (
            <TransactionCard key={`dup-${trx.id}-${index}`} trx={trx} />
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-2">
        <span className="text-xs text-cyan-400 flex items-center gap-1.5 font-medium bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
           Live Transaksi · Hover untuk berhenti
        </span>
      </div>
    </div>
  );
}

function TransactionCard({ trx }: { trx: RecentTransaction }) {
  return (
    <div
      className={`flex items-center gap-3 border rounded-xl p-3 pr-5 shrink-0 transition-all ${trx.isDummy
          ? "bg-white/[0.015] border-white/5 opacity-70"
          : "bg-purple-500/5 border-purple-500/20 shadow-sm shadow-purple-500/10"
        }`}
    >
      <div className="w-10 h-10 relative rounded-lg overflow-hidden shrink-0 border border-white/10">
        <Image
          src={trx.gameImage || "https://placehold.co/100x100"}
          alt={trx.gameName}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="flex flex-col">
        <span className="text-white font-bold text-sm truncate max-w-[120px]">{trx.gameName}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${trx.isDummy ? "text-yellow-500" : "text-green-400"}`}>
            <CheckCircle className="w-3 h-3" />
            {trx.isDummy ? "Berhasil" : "✓ Berhasil"}
          </span>
          <span className="text-gray-500 text-[10px] shrink-0">
            · {trx.timeElapsed}
          </span>
        </div>
        {!trx.isDummy && trx.productName && (
          <span className="text-purple-300 text-[10px] font-medium mt-0.5 truncate max-w-[120px]">{trx.productName}</span>
        )}
      </div>

      {!trx.isDummy && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0 self-start mt-1" />
      )}
    </div>
  );
}
