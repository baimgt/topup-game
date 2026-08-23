"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  label: string;
  value: string;
  icon?: string;
}

interface CustomSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  error?: string;
}

export default function CustomSelect({
  label,
  placeholder = "Pilih server / opsi",
  value,
  options = [],
  onChange,
  className,
  error,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={cn("w-full relative", className)}>
      {label && (
        <label className="block text-sm font-medium mb-1.5 transition-colors duration-200 text-gray-300">
          {label}
        </label>
      )}

      {/* Select Box Trigger */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-black/20 backdrop-blur-md border border-white/5 rounded-xl px-4 py-3 text-left text-black flex items-center justify-between transition-all duration-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] cursor-pointer select-none",
          isOpen
            ? "border-purple-500 ring-2 ring-purple-500/50 bg-black/40 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
            : "hover:border-purple-500/40 hover:bg-black/30",
          error && "border-red-500 ring-red-500"
        )}
      >
        <span className={cn("text-sm font-semibold truncate", !selectedOption && "text-gray-500 font-normal")}>
          {selectedOption ? (selectedOption.label || selectedOption.value) : placeholder}
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={cn("text-gray-400 flex-shrink-0 ml-2", isOpen && "text-purple-400")}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Animated glow border on open */}
      {isOpen && !error && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-purple-500/30 to-cyan-500/30 blur-md pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Floating Glass Dropdown Panel with Clear Black Text Options (No Icons) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-purple-500/40 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(168,85,247,0.3)] max-h-60 overflow-y-auto"
          >
            <div className="space-y-1">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500 text-center font-medium">Tidak ada pilihan</div>
              ) : (
                options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer",
                        isSelected
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md"
                          : "text-gray-900 font-semibold hover:bg-purple-100 hover:text-purple-950"
                      )}
                    >
                      <span className={cn("truncate", isSelected ? "text-white font-bold" : "text-black font-bold")}>
                        {opt.label || opt.value}
                      </span>

                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-white text-xs flex-shrink-0 ml-2 shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-xs text-red-400 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}
