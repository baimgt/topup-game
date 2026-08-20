"use client";

import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import { Game } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GameCardProps {
  game: Game;
  className?: string;
  index?: number;
}

export default function GameCard({ game, className, index = 0 }: GameCardProps) {
  const bannerImage = game.bannerUrl || game.imageUrl;
  const iconImage = game.iconUrl || game.imageUrl;

  return (
    <Link href={`/games/${game.slug}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: index * 0.04 }}
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer text-left",
          className
        )}
      >
        {/* Top Banner Area with Centered Icon */}
        <div className="relative h-44 w-full bg-gradient-to-b from-[#a499be] via-[#c6bedb] to-white flex items-center justify-center overflow-hidden">
          {bannerImage && (
            <Image
              src={bannerImage}
              alt={`${game.name} Banner`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover opacity-60 group-hover:scale-105 transition-all duration-500 ease-out"
            />
          )}
          {/* Smooth gradient fade to white */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />

          {/* Centered Game Icon */}
          <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-0.5 shadow-xl group-hover:scale-105 transition-transform duration-300 bg-gradient-to-b from-white/60 to-transparent">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-md border border-white/80 relative flex items-center justify-center">
              {iconImage ? (
                <Image
                  src={iconImage}
                  alt={`${game.name} Icon`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#818cf8] via-[#a855f7] to-[#38bdf8] flex items-center justify-center shadow-inner">
                  <span className="text-2xl font-black text-white">{game.name.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Content Area */}
        <div className="p-5 pt-2 flex-1 flex flex-col justify-between bg-white">
          <div>
            <h3 className="text-[#0f172a] font-bold text-base sm:text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">
              {game.name}
            </h3>
            <p className="text-[#64748b] text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
              {game.description || `Top up ${game.name} murah, cepat, dan aman`}
            </p>
          </div>

          {/* Product Pill Badge */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] w-fit px-3.5 py-1.5 rounded-full border border-[#e2e8f0] transition-colors">
              <Zap className="w-3.5 h-3.5 text-[#3b82f6] fill-[#3b82f6]" />
              <span className="text-xs font-bold text-[#334155]">
                {game.products && game.products.length > 0 ? `${game.products.length} Produk` : "15 Produk"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
