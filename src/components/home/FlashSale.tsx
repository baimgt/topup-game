"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface FlashSaleProduct {
  id: string;
  name: string;
  gameName: string;
  gameSlug: string;
  gameImageUrl?: string;
  price: number; // Original Price
  sellingPrice: number; // Discount Price
  stockPercent: number; // For progress bar
  stockLeft: number;
  endTime: string;
}

interface FlashSaleProps {
  games: any[];
}

export default function FlashSale({ games }: FlashSaleProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [flashProducts, setFlashProducts] = useState<FlashSaleProduct[]>([]);

  // Calculate remaining seconds from an ISO date string
  const getSecondsLeft = (endTimeStr: string) => {
    const end = new Date(endTimeStr).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
  };

  // Find the earliest expiring active flash sale
  const getMinTimeLeft = (products: FlashSaleProduct[]) => {
    if (products.length === 0) return 0;
    const now = Date.now();
    const endTimes = products
      .map((p) => new Date(p.endTime).getTime())
      .filter((t) => t > now);
    if (endTimes.length === 0) return 0;
    const minEnd = Math.min(...endTimes);
    return Math.max(0, Math.floor((minEnd - now) / 1000));
  };

  // Format seconds to hh:mm:ss
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Fetch flash sales or fallback to mock data
  useEffect(() => {
    async function loadFlashSales() {
      try {
        const res = await fetch("/api/flash-sales");
        const json = await res.json();
        
        if (json.success && json.data && json.data.length > 0) {
          const mapped = json.data.map((item: any) => {
            const stockPercent = item.stockTotal > 0 ? Math.round((item.stockLeft / item.stockTotal) * 100) : 0;
            return {
              id: item.id,
              name: item.productName,
              gameName: item.gameName,
              gameSlug: item.gameSlug,
              gameImageUrl: item.gameImageUrl,
              price: item.originalPrice,
              sellingPrice: item.discountPrice,
              stockPercent: stockPercent,
              stockLeft: item.stockLeft,
              endTime: item.endTime,
            };
          });
          setFlashProducts(mapped);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch flash sales:", err);
      }

      // Jika tidak ada data dari API, biarkan kosong (tidak pakai data dummy)
      setFlashProducts([]);
    }

    loadFlashSales();
  }, [games]);

  // Timer Countdown Effect
  useEffect(() => {
    if (flashProducts.length === 0) return;

    const initialTimeLeft = getMinTimeLeft(flashProducts);
    setTimeLeft(initialTimeLeft);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          const nextTime = getMinTimeLeft(flashProducts);
          if (nextTime <= 0) {
            clearInterval(timer);
          }
          return nextTime;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [flashProducts]);

  if (flashProducts.length === 0) return null;

  return (
    <section className="py-12 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Flash Sale Header */}
        <div className="flex items-center gap-3.5 mb-8">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
            Flash Sale
          </h2>
          {timeLeft > 0 && (
            <div className="bg-indigo-600 text-white font-mono font-bold text-sm md:text-base px-3 py-1 rounded-full shadow-[0_2px_10px_rgba(79,70,229,0.2)] flex items-center gap-1.5 animate-pulse">
              <span className="text-[11px] font-sans tracking-wide uppercase opacity-90">Selesai Dalam</span>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* Left Column: Flash Sale Visual cover (Large Card) */}
          <div className="lg:col-span-1 relative h-[240px] lg:h-auto rounded-3xl overflow-hidden shadow-lg border border-black/5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 group">
            <Image
              src="/flash_sale_banner.png"
              alt="Flash Sale Cover"
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            
            {/* Tagline text overlay */}
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <h3 className="text-xl font-extrabold tracking-tight">DISKON KILAT HARI INI</h3>
              <p className="text-xs text-white/70 mt-1">Dapatkan item game terpopuler dengan harga potong abis!</p>
              <p className="text-[10px] text-blue-300 font-bold uppercase mt-3 tracking-widest bg-black/40 px-2 py-1 rounded-md w-fit">Harga belum termasuk biaya admin</p>
            </div>
          </div>

          {/* Right Column: Flash Sale products grid */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {flashProducts.map((product) => {
              const discountPercent = Math.round(((product.price - product.sellingPrice) / product.price) * 100);

              return (
                <Link key={product.id} href={`/games/${product.gameSlug}`} className="group">
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-5 flex flex-col justify-between h-full hover:shadow-xl hover:border-indigo-500/20 transition-all hover:-translate-y-1 relative">
                    
                    {/* Game Badge / Icon */}
                    <div className="flex gap-3.5 items-center mb-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                        {product.gameImageUrl ? (
                          <Image
                            src={product.gameImageUrl}
                            alt={product.gameName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-indigo-600 flex items-center justify-center text-white font-black">
                            {product.gameName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-900 font-bold text-sm truncate">{product.name}</p>
                        <p className="text-slate-500 text-xs truncate mt-0.5">{product.gameName}</p>
                      </div>
                    </div>

                    {/* Price and Disount */}
                    <div className="space-y-1.5 mb-5">
                      <p className="text-indigo-600 text-lg md:text-xl font-black tracking-tight">
                        {formatCurrency(product.sellingPrice)}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded">
                          -{discountPercent}%
                        </span>
                        <span className="text-slate-400 line-through">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Stock bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${product.stockPercent}%` }}
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                      <p className="text-[11px] font-bold text-slate-500">
                        {product.stockLeft} tersisa
                      </p>
                    </div>

                    {/* Floating buy indicator on hover */}
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-indigo-500/20">
                      →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
