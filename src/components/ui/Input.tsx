"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { motion } from "framer-motion";

import { HTMLMotionProps } from "framer-motion";

type MergedProps = Omit<InputHTMLAttributes<HTMLInputElement>, keyof HTMLMotionProps<"input">> & HTMLMotionProps<"input">;

interface InputProps extends MergedProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            "block text-sm font-medium mb-1.5 transition-colors duration-200",
            isFocused ? "text-purple-400" : "text-gray-300"
          )}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
              isFocused ? "text-purple-400" : "text-gray-500"
            )}>
              {icon}
            </div>
          )}
          <motion.input
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "w-full bg-black/20 backdrop-blur-md border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-black/40 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
              icon && "pl-11",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-500/5",
              className
            )}
            {...props}
          />
          {/* Animated glow border on focus */}
          {isFocused && !error && (
            <motion.div
              layoutId="input-glow"
              className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-purple-500/30 to-cyan-500/30 blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-sm text-red-400 font-medium"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
