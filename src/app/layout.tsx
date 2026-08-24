import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let siteName = "GamerStore";
  let siteDesc = "Platform top up game terpercaya dengan proses cepat, aman, dan harga terbaik.";
  let siteLogo = "";

  try {
    await connectDB();
    const settings = await Setting.findOne({}).lean();
    if (settings) {
      if (settings.siteName) siteName = settings.siteName;
      if (settings.siteDescription) siteDesc = settings.siteDescription;
      if (settings.siteLogo) siteLogo = settings.siteLogo;
    }
  } catch (error) {
    console.error("Failed to fetch settings for metadata:", error);
  }

  const iconUrl = siteLogo || "/favicon.svg";

  return {
    title: `${siteName} - Top Up Game Terpercaya`,
    description: siteDesc,
    keywords: "top up game, mobile legends, free fire, pubg, valorant, genshin impact, voucher game",
    icons: {
      icon: [{ url: iconUrl }],
      shortcut: [{ url: iconUrl }],
      apple: [{ url: iconUrl }],
    },
  };
}

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
      <body className="min-h-screen bg-[#09090b] text-white">
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
