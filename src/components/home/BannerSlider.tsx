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

  const prevSlide = () => {
    if (banners.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

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

  return (
    <div className="relative py-6 w-full select-none overflow-hidden">
      {/* Slides Container */}
      <div className="max-w-7xl mx-auto px-4 relative flex items-center justify-center">
        {/* Previous Button */}
        {banners.length > 1 && (
          <button
            onClick={prevSlide}
            className="absolute left-6 z-20 w-11 h-11 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Carousel Area */}
        <div className="w-full flex items-center justify-center min-h-[200px] h-[240px] sm:h-[280px] md:h-[340px] relative">
          <AnimatePresence initial={false} mode="popLayout">
            {banners.map((banner, index) => {
              // Calculate relative positioning for 3D/center active layout
              let position = "hidden";
              if (index === currentIndex) {
                position = "active";
              } else if (index === (currentIndex - 1 + banners.length) % banners.length) {
                position = "prev";
              } else if (index === (currentIndex + 1) % banners.length) {
                position = "next";
              }

              if (position === "hidden" && banners.length > 1) return null;

              // If there's only one banner, make sure it renders as active
              const isCenter = position === "active" || banners.length === 1;
              const bannerKey = banner._id || banner.id || `banner-${index}`;

              const cardContent = (
                <>
                  {banner.bannerType !== "image" && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
                  )}
                  
                  {banner.bannerType === "image" ? (
                    // Subtle hover overlay for image banners
                    <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors duration-300 pointer-events-none" />
                  ) : (
                    <>
                      {/* Banner Header */}
                      <div className="relative z-10 flex justify-between items-start w-full">
                        <span className="bg-white/10 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-white/10">
                          {banner.badge || "Promo"}
                        </span>
                        <span className={`font-black text-xl sm:text-2xl md:text-4xl italic tracking-tighter ${banner.textColor || "text-blue-400"}`}>
                          {banner.discount}
                        </span>
                      </div>

                      {/* Banner Content */}
                      <div className="relative z-10 space-y-1.5 md:space-y-3 w-full text-left">
                        <h3 className="text-white text-lg sm:text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                          {banner.title}
                        </h3>
                        <p className="text-white/80 font-medium text-xs sm:text-sm md:text-lg line-clamp-1">
                          {banner.subtitle}
                        </p>
                        <p className="text-white/60 text-xs md:text-sm max-w-xl line-clamp-1 md:line-clamp-2 leading-relaxed hidden sm:block">
                          {banner.description}
                        </p>
                      </div>

                      {/* Indicator Line bottom */}
                      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wider text-white/50 w-full">
                        <span>Eksklusif di Platform Kami</span>
                        <span className="text-white select-all cursor-pointer font-mono">Promo Spesial</span>
                      </div>
                    </>
                  )}
                </>
              );

              return (
                <motion.div
                  key={bannerKey}
                  style={banner.bannerType === "image" && banner.imageUrl ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: banner.bgGradient || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)" }}
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    x: position === "prev" ? -150 : position === "next" ? 150 : 0,
                    zIndex: isCenter ? 10 : 1,
                  }}
                  animate={{
                    opacity: isCenter ? 1 : 0.4,
                    scale: isCenter ? 1 : 0.85,
                    x: position === "prev" ? -240 : position === "next" ? 240 : 0,
                    zIndex: isCenter ? 10 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className={`absolute w-[88%] sm:w-[82%] md:w-[65%] max-w-4xl min-h-[180px] h-[200px] sm:h-[240px] md:h-[280px] rounded-2xl md:rounded-3xl border border-white/10 overflow-hidden shadow-2xl transition-all banner-slide-card ${
                    isCenter ? "shadow-indigo-500/5" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!isCenter) setCurrentIndex(index);
                  }}
                >
                  {isCenter && banner.linkUrl ? (
                    <Link href={banner.linkUrl} className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-10 z-20">
                      {cardContent}
                    </Link>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 md:p-10">
                      {cardContent}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Next Button */}
        {banners.length > 1 && (
          <button
            onClick={nextSlide}
            className="absolute right-6 z-20 w-11 h-11 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Indicator Dash Indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2 md:mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-8 bg-indigo-600" : "w-4 bg-gray-600"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
