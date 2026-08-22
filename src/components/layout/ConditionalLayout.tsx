"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("Website sedang dalam perbaikan. Silakan kembali lagi nanti.");
  
  // Announcement states
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementImage, setAnnouncementImage] = useState("");
  const [announcementUrl, setAnnouncementUrl] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const [loading, setLoading] = useState(!isAdmin); // Loading only if not admin

  useEffect(() => {
    if (isAdmin) return;

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setIsMaintenance(data.data.maintenanceMode);
          if (data.data.maintenanceMessage) setMaintenanceMsg(data.data.maintenanceMessage);
          
          if (data.data.announcementEnabled) {
            setIsAnnouncement(true);
            setAnnouncementText(data.data.announcementText);
            setAnnouncementImage(data.data.announcementImage);
            setAnnouncementUrl(data.data.announcementUrl);
            
            // Check session storage
            const dismissed = sessionStorage.getItem("announcementDismissed");
            if (!dismissed) {
              setShowPopup(true);
            }
          }
        }
      })
      .catch((err) => console.error("Failed to load settings", err))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleClosePopup = () => {
    setShowPopup(false);
    sessionStorage.setItem("announcementDismissed", "true");
  };

  const handleBannerClick = () => {
    if (announcementUrl) {
      window.open(announcementUrl, "_blank");
    }
  };

  if (isAdmin) {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0B0B0F]" />;
  }

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
          
          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-ping"
              style={{
                left: `${10 + (i * 8)}%`,
                top: `${15 + (i % 4) * 20}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2 + (i % 3)}s`,
              }}
            />
          ))}

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Main card */}
        <div className="relative z-10 max-w-lg w-full">
          {/* Glowing border card */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-lg opacity-40 animate-pulse" />
            
            <div className="relative bg-[#0f0f17]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 text-center overflow-hidden">
              {/* Inner shine */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

              {/* Gear icon animated */}
              <div className="relative mx-auto mb-8 w-28 h-28">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-28 h-28 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-full flex items-center justify-center">
                  {/* Rotating outer ring */}
                  <div
                    className="absolute inset-1 border-2 border-dashed border-purple-500/30 rounded-full"
                    style={{ animation: "spin 8s linear infinite" }}
                  />
                  <div
                    className="absolute inset-3 border border-dashed border-blue-500/20 rounded-full"
                    style={{ animation: "spin 5s linear infinite reverse" }}
                  />
                  {/* Icon */}
                  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ animation: "spin 12s linear infinite" }}>
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">Maintenance Mode</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 mb-4 leading-tight">
                Sedang Dalam<br />Perbaikan
              </h1>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                <div className="w-2 h-2 rounded-full bg-purple-500/50" />
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
              </div>

              {/* Message */}
              <p className="text-gray-300 leading-relaxed text-base mb-8 px-2">
                {maintenanceMsg}
              </p>

              {/* Status indicators */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { label: "Server", status: "Online", color: "green" },
                  { label: "Database", status: "Aktif", color: "green" },
                  { label: "Layanan", status: "Update", color: "yellow" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 animate-pulse ${item.color === "green" ? "bg-green-400" : "bg-yellow-400"}`} />
                    <div className={`text-xs font-semibold ${item.color === "green" ? "text-green-400" : "text-yellow-400"}`}>{item.status}</div>
                    <div className="text-gray-500 text-[10px] mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <p className="text-gray-600 text-xs">
                Terima kasih atas kesabaran Anda 🙏
              </p>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }


  return (
    <div className="gaming-light-theme min-h-screen flex flex-col">
      <AnimatePresence>
        {isAnnouncement && showPopup && (announcementImage || announcementText) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-lg w-full bg-gaming-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={handleClosePopup}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div 
                className={`flex flex-col ${announcementUrl ? "cursor-pointer" : ""}`}
                onClick={handleBannerClick}
              >
                {announcementImage ? (
                  <img src={announcementImage} alt="Announcement Banner" className="w-full h-auto object-cover max-h-[400px]" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                    <AlertTriangle className="w-12 h-12 text-purple-400 opacity-50" />
                  </div>
                )}
                
                {announcementText && (
                  <div className="p-5 text-center bg-white/5">
                    <p className="text-white font-medium">{announcementText}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="pt-16 flex-1 flex flex-col"
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
