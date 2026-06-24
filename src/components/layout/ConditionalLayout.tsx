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
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Under Maintenance</h1>
          <p className="text-gray-400 leading-relaxed">{maintenanceMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pt-16 min-h-screen flex flex-col"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  );
}
