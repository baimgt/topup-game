import Link from "next/link";
import { Zap, Shield, Clock, Star, ChevronRight, Gamepad2, Trophy } from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Game from "@/models/Game";
import Product from "@/models/Product";
import Button from "@/components/ui/Button";
import AnimatedSection from "@/components/ui/AnimatedSection";
import BannerSlider from "@/components/home/BannerSlider";
import FlashSale from "@/components/home/FlashSale";
import HomeGamesList from "@/components/home/HomeGamesList";
import RecentTransactions from "@/components/home/RecentTransactions";
import Order from "@/models/Order";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

async function getFeaturedGames() {
  try {
    await connectDB();
    const games = await Game.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    // Run all product queries in parallel instead of one-by-one for much better performance
    const results = await Promise.all(
      games.map(async (game) => {
        const products = await Product.find({ gameId: game._id, isActive: true })
          .sort({ sortOrder: 1 })
          .lean();
        return JSON.parse(JSON.stringify({ ...game, id: game._id.toString(), products }));
      })
    );
    return results;
  } catch {
    return [];
  }
}

async function getRecentTransactions() {
  try {
    await connectDB();
    const orders = await Order.find({ orderStatus: "SUCCESS" })
      .sort({ createdAt: -1 })
      .limit(12) // reduced from 15
      .select("_id customerName gameName orderItems orderStatus createdAt gameId") // only fetch needed fields
      .populate("gameId", "imageUrl")
      .lean();

    return orders.map((order: any) => ({
      id: order._id.toString(),
      customerName: order.customerName,
      gameName: order.gameName,
      productName: order.orderItems[0]?.productName || "Product",
      status: order.orderStatus,
      timeElapsed: formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: id }),
      gameImage: order.gameId?.imageUrl || "https://placehold.co/100x100",
    }));
  } catch (err) {
    return [];
  }
}

const features = [
  { icon: <Zap className="w-6 h-6 text-blue-500" />, title: "Proses Instan", desc: "Top up langsung diproses otomatis dalam hitungan detik tanpa ribet" },
  { icon: <Shield className="w-6 h-6 text-indigo-500" />, title: "100% Aman", desc: "Transaksi dilindungi enkripsi kelas militer dan payment gateway resmi" },
  { icon: <Clock className="w-6 h-6 text-sky-500" />, title: "24/7 Tersedia", desc: "Layanan nonstop siang dan malam, siap menemani mabar Anda" },
  { icon: <Star className="w-6 h-6 text-violet-500" />, title: "Harga Terbaik", desc: "Dapatkan harga termurah dengan diskon spesial setiap harinya" },
];

export default async function HomePage() {
  // Fetch both data sources in parallel for maximum speed
  const [games, recentTransactions] = await Promise.all([
    getFeaturedGames(),
    getRecentTransactions(),
  ]);

  return (
    <div className="gaming-light-theme min-h-screen overflow-hidden">
      {/* Spacer for Navbar */}
      <div className="h-24 md:h-28" />

      {/* Banner Carousel */}
      <section className="relative z-10">
        <BannerSlider />
      </section>

      {/* Flash Sale Section */}
      <section className="relative z-10 border-t border-black/[0.04] mt-2">
        <FlashSale games={games} />
      </section>

      {/* Recent Transactions */}
      <section className="relative z-10">
        <RecentTransactions transactions={recentTransactions} />
      </section>

      {/* Features */}
      <section className="py-24 px-4 relative z-10">
        <div className="absolute inset-0 bg-gaming-card/30 backdrop-blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Kenapa Memilih Kami?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Pengalaman top up terbaik yang dirancang khusus untuk kenyamanan para gamer.</p>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={0.1 * i} direction="up">
                <div className="bg-gaming-card/50 backdrop-blur-sm rounded-2xl p-8 border border-white/5 hover:border-orange-500/30 transition-all hover:bg-gaming-cardHover group hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all border border-white/10 group-hover:border-orange-500/50">
                    {f.icon}
                  </div>
                  <h3 className="text-xl text-white font-bold mb-3">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Games */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection direction="left" className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold tracking-wider uppercase text-sm">Game Terpopuler</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white">Top Up Sekarang</h2>
            </div>
            <Link href="/games">
              <Button variant="outline" className="rounded-full">Lihat Semua Game <ChevronRight className="w-4 h-4" /></Button>
            </Link>
          </AnimatedSection>

          <HomeGamesList initialGames={games as any} />
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-20 px-4 relative border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto text-center">
          <AnimatedSection direction="up">
            <h2 className="text-2xl font-bold text-white mb-4">Metode Pembayaran Lengkap</h2>
            <p className="text-gray-400 text-sm mb-10 max-w-xl mx-auto">Kami mendukung berbagai metode pembayaran untuk memudahkan transaksi Anda di mana saja dan kapan saja.</p>
            
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {["QRIS", "GoPay", "OVO", "Dana", "ShopeePay", "LinkAja", "BCA", "Mandiri", "BNI", "BRI", "Alfamart", "Indomaret"].map((m, i) => (
                <div key={m} className="bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all rounded-xl px-5 py-3 text-gray-300 text-sm font-medium cursor-default">
                  {m}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
