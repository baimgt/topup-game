import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "GamerStore- Top Up Game Terpercaya",
  description: "Platform top up game terpercaya dengan proses cepat, aman, dan harga terbaik.",
  keywords: "top up game, mobile legends, free fire, pubg, valorant, genshin impact",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <script
          type="text/javascript"
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          async
        />
      </head>
      <body className="gaming-light-theme min-h-screen">
        <ConditionalLayout>{children}</ConditionalLayout>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#ffffff", color: "#1e293b", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" },
          }}
        />
      </body>
    </html>
  );
}
