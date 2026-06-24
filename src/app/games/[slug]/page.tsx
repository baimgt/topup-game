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

        <div className="bg-gaming-card rounded-2xl border border-white/5 overflow-hidden mb-8">
          <div className="relative h-48 bg-gradient-to-br from-purple-900/50 to-blue-900/50">
            {game.imageUrl ? (
              <Image src={game.imageUrl} alt={game.name} fill className="object-cover opacity-60" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <Gamepad2 className="w-10 h-10 text-white" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gaming-card to-transparent" />
          </div>

          <div className="p-6 -mt-8 relative">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-gaming-card">
                <span className="text-2xl font-bold text-white">{game.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{game.name}</h1>
                <p className="text-gray-400 text-sm">{game.category}</p>
              </div>
            </div>
            {game.description && (
              <p className="text-gray-400 text-sm mt-4 leading-relaxed">{game.description}</p>
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
