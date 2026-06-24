"use client";

import { useState } from "react";
import { CreditCard, Zap } from "lucide-react";
import PaymentMethodsTab from "./tabs/PaymentMethodsTab";
import DigiflazzProductsTab from "./tabs/DigiflazzProductsTab";

type Tab = "methods" | "products";

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "methods", label: "Metode Pembayaran", icon: <CreditCard className="w-4 h-4" /> },
  { key: "products", label: "Produk Digiflazz", icon: <Zap className="w-4 h-4" /> },
];

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("methods");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Payment Gateway</h1>
          <p className="text-gray-400 text-sm mt-1">Kelola konfigurasi pembayaran dan sinkronisasi produk supplier.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-2 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "methods" && <PaymentMethodsTab />}
        {activeTab === "products" && <DigiflazzProductsTab />}
      </div>
    </div>
  );
}
