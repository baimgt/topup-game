"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Banner {
  _id?: string;
  id?: number;
  bannerType?: "text" | "image";
  title?: string;
  subtitle?: string;
  badge?: string;
  discount?: string;
  description?: string;
  bgGradient?: string;
  textColor?: string;
  imageUrl?: string;
  linkUrl?: string;
}

const FALLBACK_BANNERS: Banner[] = [
  {
    id: 1,
    bannerType: "text",
    title: "REXUS x Attack on Titan",
    subtitle: "Mechanical Keyboard & Gaming Mouse Series",
    badge: "Special Promo",
    discount: "UP TO 45%",
    description: "Nikmati pengalaman gaming maksimal dengan perangkat edisi terbatas AoT.",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)",
    textColor: "text-blue-400",
  },
  {
    id: 2,
    bannerType: "text",
    title: "MAIN GAME DAPAT JUTAAN",
    subtitle: "Gabung Creator Affiliate Program",
    badge: "Cashback Program",
    discount: "JUTAAN RUPIAH",
    description: "Buat konten kreatif game kesukaanmu, raih jutaan rupiah komisi bulanan.",
    bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #020617 100%)",
    textColor: "text-cyan-400",
  },
  {
    id: 3,
    bannerType: "text",
    title: "NAILBONG SUPER SALE",
    subtitle: "Weekly Limited Game Pack Discount",
    badge: "Flash Promo",
    discount: "DISCOUNT 80%",
    description: "Top up instan paket game termurah eksklusif hanya minggu ini.",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e1b4b 100%)",
    textColor: "text-indigo-300",
  },
];

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS);
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (banners.length === 0) return 0;
      return (prevIndex + 1) % banners.length;
    });
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch("/api/banners");
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setBanners(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch banners:", err);
      }
    }
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, banners.length]);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex] || banners[0];
  const bannerKey = currentBanner._id || currentBanner.id || `banner-${currentIndex}`;

  const renderCardContent = (banner: Banner) => (
    <>
      {banner.bannerType !== "image" && (
        <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
      )}
      
      {banner.bannerType === "image" ? (
        <div className="relative w-full h-full flex items-center justify-center bg-[#0b071e]">
          {banner.imageUrl && (
            <img
              src={banner.imageUrl}
              alt={banner.title || "Promo Banner"}
              className="w-full h-full object-cover object-center rounded-2xl md:rounded-3xl pointer-events-none select-none"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 hover:bg-black/0 transition-colors duration-300 pointer-events-none rounded-2xl md:rounded-3xl" />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 md:p-10 relative z-10">
          {/* Banner Header */}
          <div className="flex justify-between items-start w-full gap-2">
            <span className="bg-white/10 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10">
              {banner.badge || "Promo"}
            </span>
            <span className={`font-black text-base sm:text-2xl md:text-4xl italic tracking-tight ${banner.textColor || "text-blue-400"}`}>
              {banner.discount}
            </span>
          </div>

          {/* Banner Content */}
          <div className="space-y-1 sm:space-y-2 md:space-y-3 w-full text-left my-auto">
            <h3 className="text-white text-sm sm:text-2xl md:text-4xl font-extrabold tracking-tight leading-tight line-clamp-1 sm:line-clamp-2">
              {banner.title}
            </h3>
            <p className="text-white/80 font-medium text-xs sm:text-sm md:text-lg line-clamp-1">
              {banner.subtitle}
            </p>
            <p className="text-white/60 text-xs md:text-sm max-w-xl line-clamp-1 md:line-clamp-2 leading-relaxed hidden sm:block">
              {banner.description}
            </p>
          </div>

          {/* Indicator Line bottom (Desktop only to prevent cramming) */}
          <div className="hidden sm:flex items-center justify-between border-t border-white/10 pt-3 md:pt-4 text-xs font-semibold uppercase tracking-wider text-white/50 w-full">
            <span>Eksklusif di Platform Kami</span>
            <span className="text-white select-all cursor-pointer font-mono">Promo Spesial</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="relative py-2 sm:py-5 w-full select-none overflow-hidden">
      {/* Slides Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        
        {/* Full-width Carousel Frame with Aspect Ratio */}
        <div className="w-full relative aspect-[2.1/1] sm:aspect-[2.4/1] md:aspect-[2.8/1] min-h-[140px] max-h-[380px] rounded-2xl md:rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-[#0b071e]">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={bannerKey}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                const swipeThreshold = 25;
                if (info.offset.x < -swipeThreshold || info.velocity.x < -250) {
                  nextSlide();
                } else if (info.offset.x > swipeThreshold || info.velocity.x > 250) {
                  prevSlide();
                }
              }}
              style={currentBanner.bannerType === "image" ? { backgroundColor: "#0b071e" } : { background: currentBanner.bgGradient || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)" }}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="w-full h-full cursor-grab active:cursor-grabbing relative"
            >
              {currentBanner.linkUrl ? (
                <Link href={currentBanner.linkUrl} className="w-full h-full block">
                  {renderCardContent(currentBanner)}
                </Link>
              ) : (
                <div className="w-full h-full">
                  {renderCardContent(currentBanner)}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimalist Bottom Indicator Dots */}
        {banners.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-3 sm:mt-4">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-indigo-500 shadow-md shadow-indigo-500/50"
                    : "w-2.5 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
