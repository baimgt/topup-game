import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { connectDB } from "@/lib/mongoose";
import Game from "@/models/Game";
import Product from "@/models/Product";
import OrderForm from "@/components/order/OrderForm";

interface GameDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getGame(slug: string) {
  try {
    await connectDB();
    const game = await Game.findOne({ slug, isActive: true }).lean();
    if (!game) return null;
    const products = await Product.find({ gameId: game._id, isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
    
    // Import dynamically or ensure we have access to FlashSale model
    const FlashSale = (await import("@/models/FlashSale")).default;
    const flashSales = await FlashSale.find({
      isActive: true,
      endTime: { $gt: new Date() },
      stockLeft: { $gt: 0 }
    }).lean();
    
    const flashSaleMap = new Map(flashSales.map((fs: any) => [fs.productId.toString(), fs]));

    const formattedProducts = products.map((p: any) => {
      const fs = flashSaleMap.get(p._id.toString());
      return { 
        ...p, 
        id: p._id.toString(),
        originalPrice: fs ? p.sellingPrice : undefined,
        sellingPrice: fs ? fs.discountPrice : p.sellingPrice,
        isFlashSale: !!fs
      };
    });
    return JSON.parse(JSON.stringify({ ...game, id: game._id.toString(), products: formattedProducts }));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: GameDetailPageProps) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) return { title: "Game Tidak Ditemukan" };
  return {
    title: `Top Up ${game.name} - GamerStore`,
    description: `Top up ${game.name} dengan harga terbaik dan proses instan.`,
  };
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/games" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Game
        </Link>

        <div className="bg-gaming-card rounded-2xl border border-white/5 overflow-hidden mb-8 shadow-xl">
          {/* Top Banner Backdrop */}
          <div className="relative h-52 sm:h-60 bg-gradient-to-br from-purple-900/60 via-slate-900/80 to-blue-900/60">
            {(game.bannerUrl || game.imageUrl) ? (
              <Image 
                src={game.bannerUrl || game.imageUrl} 
                alt={`${game.name} Banner`} 
                fill 
                priority
                className="object-cover opacity-60" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Gamepad2 className="w-10 h-10 text-white" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gaming-card via-gaming-card/40 to-transparent" />
          </div>

          {/* Game Icon & Info */}
          <div className="p-6 -mt-12 sm:-mt-14 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-b from-white/30 via-purple-500/40 to-black/60 shadow-2xl flex-shrink-0">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-gaming-card border-2 border-gaming-card relative flex items-center justify-center">
                  {(game.iconUrl || game.imageUrl) ? (
                    <Image
                      src={game.iconUrl || game.imageUrl}
                      alt={`${game.name} Icon`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-3xl font-black text-white">{game.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{game.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                  <span className="bg-white/10 text-gray-300 text-xs px-3 py-1 rounded-full font-semibold border border-white/5">
                    {game.category}
                  </span>
                  {game.isCheckAccountSupported && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-500/20">
                      ✓ Cek ID Aktif
                    </span>
                  )}
                </div>
              </div>
            </div>
            {game.description && (
              <p className="text-gray-400 text-sm mt-4 leading-relaxed border-t border-white/5 pt-4">{game.description}</p>
            )}
          </div>
        </div>

        <div className="bg-gaming-card rounded-2xl border border-white/5 p-6">
          <OrderForm game={game as any} />
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-300 text-sm">
            💡 <strong>Cara Top Up:</strong> Pilih nominal → Masukkan ID akun game → Isi data pembeli → Bayar. Diamond/item akan masuk otomatis setelah pembayaran berhasil.
          </p>
        </div>
      </div>
    </div>
  );
}
