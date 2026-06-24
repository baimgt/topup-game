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
  return (
    <Link href={`/games/${game.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative bg-gaming-card/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-colors duration-300 shadow-lg cursor-pointer",
          className
        )}
      >
        {/* Game Image */}
        <div className="relative h-44 bg-gradient-to-br from-purple-900/50 to-cyan-900/50 overflow-hidden">
          {game.imageUrl ? (
            <Image
              src={game.imageUrl}
              alt={game.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-extrabold text-white">
                  {game.name.charAt(0)}
                </span>
              </div>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gaming-card via-gaming-card/20 to-transparent" />
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-purple-500/30 to-transparent mix-blend-overlay" />
        </div>

        {/* Content */}
        <div className="p-5 relative z-10">
          <h3 className="text-white font-bold text-base group-hover:text-purple-300 transition-colors line-clamp-1">
            {game.name}
          </h3>
          <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {game.description || game.category}
          </p>

          {game.products && (
            <div className="flex items-center gap-1.5 mt-4 bg-white/5 w-fit px-2.5 py-1 rounded-full border border-white/5">
              <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              <span className="text-xs font-medium text-gray-300">
                {game.products.length} Produk
              </span>
            </div>
          )}
          
          {/* Top up button text visible only on hover */}
          <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
              TOP UP <span className="text-lg leading-none">→</span>
            </span>
          </div>
        </div>

        {/* Ambient border glow */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-purple-500/50 transition-all duration-500 pointer-events-none" />
      </motion.div>
    </Link>
  );
}
