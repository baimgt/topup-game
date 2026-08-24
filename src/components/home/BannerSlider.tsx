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

  return (
    <div className="relative py-3 sm:py-6 w-full select-none overflow-hidden" style={{ perspective: "1200px" }}>
      {/* Slides Container */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 relative flex items-center justify-center">
        
        {/* 3D Carousel Stage */}
        <div className="w-full flex items-center justify-center min-h-[160px] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[340px] relative">
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
                    <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
                  )}
                  
                  {banner.bannerType === "image" ? (
                    <div className="relative w-full h-full bg-[#0b071e]">
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
                    <div className="w-full h-full flex flex-col justify-between p-3.5 sm:p-6 md:p-8 relative z-10">
                      {/* Banner Header */}
                      <div className="flex justify-between items-start w-full gap-2">
                        <span className="bg-white/10 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/10">
                          {banner.badge || "Promo"}
                        </span>
                        <span className={`font-black text-sm sm:text-xl md:text-3xl italic tracking-tight ${banner.textColor || "text-blue-400"}`}>
                          {banner.discount}
                        </span>
                      </div>

                      {/* Banner Content */}
                      <div className="space-y-1 sm:space-y-2 md:space-y-3 w-full text-left my-auto">
                        <h3 className="text-white text-xs xs:text-sm sm:text-xl md:text-3xl font-extrabold tracking-tight leading-tight line-clamp-1 sm:line-clamp-2">
                          {banner.title}
                        </h3>
                        <p className="text-white/80 font-medium text-[11px] sm:text-sm md:text-base line-clamp-1">
                          {banner.subtitle}
                        </p>
                        <p className="text-white/60 text-xs md:text-sm max-w-xl line-clamp-1 md:line-clamp-2 leading-relaxed hidden sm:block">
                          {banner.description}
                        </p>
                      </div>

                      {/* Indicator Line bottom (Desktop only to prevent cramming) */}
                      <div className="hidden sm:flex items-center justify-between border-t border-white/10 pt-2.5 md:pt-4 text-[11px] md:text-xs font-semibold uppercase tracking-wider text-white/50 w-full">
                        <span>Eksklusif di Platform Kami</span>
                        <span className="text-white select-all cursor-pointer font-mono">Promo Spesial</span>
                      </div>
                    </div>
                  )}
                </>
              );

              return (
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
                  style={banner.bannerType === "image" ? { backgroundColor: "#0b071e" } : { background: banner.bgGradient || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)" }}
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    x: position === "prev" ? "-55%" : position === "next" ? "55%" : "0%",
                    rotateY: position === "prev" ? 14 : position === "next" ? -14 : 0,
                    zIndex: isCenter ? 20 : 5,
                  }}
                  animate={{
                    opacity: isCenter ? 1 : 0.45,
                    scale: isCenter ? 1 : 0.86,
                    x: position === "prev" ? "-62%" : position === "next" ? "62%" : "0%",
                    rotateY: position === "prev" ? 14 : position === "next" ? -14 : 0,
                    zIndex: isCenter ? 20 : 5,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.75,
                    transition: { duration: 0.25 }
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 26,
                    mass: 0.8
                  }}
                  className={`absolute w-[88%] sm:w-[80%] md:w-[70%] lg:w-[64%] max-w-4xl h-full rounded-2xl md:rounded-3xl border border-white/10 overflow-hidden shadow-2xl transition-shadow banner-slide-card cursor-grab active:cursor-grabbing ${
                    isCenter ? "shadow-indigo-500/10 ring-1 ring-white/15 cursor-pointer" : "cursor-pointer hover:opacity-70"
                  }`}
                  onClick={() => {
                    if (!isCenter) setCurrentIndex(index);
                  }}
                >
                  {isCenter && banner.linkUrl ? (
                    <Link href={banner.linkUrl} className="w-full h-full block">
                      {cardContent}
                    </Link>
                  ) : (
                    <div className="w-full h-full">
                      {cardContent}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
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
  );
}
