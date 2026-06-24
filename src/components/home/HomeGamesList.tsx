"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Gamepad2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GameCard from "@/components/games/GameCard";
import Button from "@/components/ui/Button";

interface HomeGamesListProps {
  initialGames: any[];
}

const HOME_CATEGORIES = [
  { id: "popular", label: "Lagi Populer", dbValue: "Lagi Populer" },
  { id: "baru-rilis", label: "Baru Rilis", dbValue: "Baru Rilis" },
  { id: "voucher", label: "Voucher", dbValue: "Voucher" },
  { id: "topup-langsung", label: "Top Up Langsung", dbValue: "Top Up Langsung" },
  { id: "topup-login", label: "Top Up Login", dbValue: "Top Up Login" },
  { id: "pulsa", label: "Pulsa", dbValue: "Pulsa" },
  { id: "entertainment", label: "Entertainment", dbValue: "Entertainment" },
];

export default function HomeGamesList({ initialGames }: HomeGamesListProps) {
  const [activeTab, setActiveTab] = useState("popular");
  const [showAll, setShowAll] = useState(false);

  // Filter games based on selected tab
  const filteredGames = initialGames.filter((game) => {
    const currentCat = HOME_CATEGORIES.find((cat) => cat.id === activeTab);
    const hasPopularGames = initialGames.some(g => g.statusCategory === "Lagi Populer");
    if (activeTab === "popular" && !hasPopularGames) {
      return true; // Fallback: show all games if none are marked "Lagi Populer"
    }
    return game.statusCategory === currentCat?.dbValue;
  });

  // Paginated/limited games list
  const displayedGames = showAll ? filteredGames : filteredGames.slice(0, 10);
  const hasMore = filteredGames.length > displayedGames.length;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setShowAll(false); // Reset show more on tab change
  };

  return (
    <div className="space-y-10">
      {/* Category Tabs */}
      <div className="flex justify-start md:justify-center overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
        <div className="bg-white/5 p-1.5 rounded-full border border-white/5 flex gap-1.5 backdrop-blur-md whitespace-nowrap">
          {HOME_CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all relative ${
                  isActive ? "text-white text-white-force" : "text-gray-400 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeHomeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {cat.id === "popular" && <Sparkles className="w-3.5 h-3.5" />}
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {displayedGames.length > 0 ? (
            <div className="space-y-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {displayedGames.map((game, i) => (
                  <GameCard key={game.id} game={game} index={i} />
                ))}
              </div>

              {/* Show More / Show Less Button */}
              {(hasMore || showAll) && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    className="rounded-full px-8 py-3 font-bold flex items-center gap-2 border-indigo-500/30 text-indigo-400 hover:border-indigo-400 hover:bg-indigo-500/10"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? (
                      <>
                        Tampilkan Lebih Sedikit <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Tampilkan Lebih Banyak <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gaming-card/30 backdrop-blur-sm rounded-3xl text-center py-20 border border-white/5">
              <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-bold text-white mb-1">Belum Ada Item</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Kategori ini sedang dalam proses penambahan produk baru.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
