import { Gamepad2, Search } from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Game from "@/models/Game";
import Product from "@/models/Product";
import GameCard from "@/components/games/GameCard";

interface GamesPageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

async function getGames(category?: string, search?: string) {
  try {
    await connectDB();
    const filter: Record<string, unknown> = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const games = await Game.find(filter).sort({ sortOrder: 1 }).lean();
    return await Promise.all(
      games.map(async (game) => {
        const products = await Product.find({ gameId: game._id, isActive: true })
          .sort({ sortOrder: 1 })
          .lean();
        return JSON.parse(JSON.stringify({ ...game, id: game._id.toString(), products }));
      })
    );
  } catch {
    return [];
  }
}

const categories = ["Semua", "Mobile", "PC", "Console", "Battle Royale", "MOBA", "RPG"];

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const { category, search } = await searchParams;
  const games = await getGames(category, search);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Semua Game</h1>
          <p className="text-gray-400">Pilih game dan top up sekarang</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form className="flex-1 relative" method="GET">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Cari game..."
              className="w-full bg-gaming-card border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => {
              const value = cat === "Semua" ? undefined : cat;
              const isActive = (!category && cat === "Semua") || category === cat;
              return (
                <a
                  key={cat}
                  href={value ? `?category=${encodeURIComponent(value)}` : "/games"}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "bg-gaming-card text-gray-400 hover:text-white border border-white/10"
                  }`}
                >
                  {cat}
                </a>
              );
            })}
          </div>
        </div>

        {games.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {games.map((game) => <GameCard key={game.id} game={game as any} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Tidak ada game ditemukan</p>
            <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}
      </div>
    </div>
  );
}
