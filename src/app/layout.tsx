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
  let siteFavicon = "";

  try {
    await connectDB();
    const settings = await Setting.findOne({}).lean();
    if (settings) {
      if (settings.siteName) siteName = settings.siteName;
      if (settings.siteDescription) siteDesc = settings.siteDescription;
      if (settings.siteLogo) siteLogo = settings.siteLogo;
      if (settings.siteFavicon) siteFavicon = settings.siteFavicon;
    }
  } catch (error) {
    console.error("Failed to fetch settings for metadata:", error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gamerstoreplus.com";
  const iconUrl = siteFavicon || siteLogo || "/favicon.svg";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${siteName} Plus - Top Up Game Terpercaya & Termurah`,
      template: `%s | ${siteName} Plus`,
    },
    description: siteDesc,
    keywords: [
      "gamerstore",
      "gamerstoreplus",
      "gamerstore plus",
      "gamer store",
      "gamerstore.com",
      "gamerstoreplus.com",
      "top up game",
      "top up game murah",
      "top up ml",
      "top up ff",
      "mobile legends",
      "free fire",
      "pubg mobile",
      "valorant",
      "genshin impact",
      "voucher game",
      "jasa top up game",
    ],
    authors: [{ name: siteName, url: baseUrl }],
    creator: siteName,
    publisher: siteName,
    alternates: {
      canonical: baseUrl,
    },
    icons: {
      icon: [
        {
          url: iconUrl,
          ...(iconUrl.endsWith(".svg") ? { type: "image/svg+xml" } : {}),
        },
        {
          url: iconUrl,
          sizes: "48x48",
        },
        {
          url: iconUrl,
          sizes: "96x96",
        },
        {
          url: iconUrl,
          sizes: "192x192",
        },
      ],
      shortcut: [
        {
          url: iconUrl,
        },
      ],
      apple: [
        {
          url: iconUrl,
          sizes: "180x180",
        },
      ],
    },
    openGraph: {
      title: `${siteName} Plus - Top Up Game Terpercaya & Termurah`,
      description: siteDesc,
      url: baseUrl,
      siteName: `${siteName} Plus`,
      locale: "id_ID",
      type: "website",
      images: [
        {
          url: siteLogo || "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${siteName} Plus`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} Plus - Top Up Game Terpercaya`,
      description: siteDesc,
      images: [siteLogo || "/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gamerstoreplus.com";
  
  // JSON-LD Structured Data for Google Brand Recognition
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "GamerStore Plus",
        "alternateName": ["GamerStore", "Gamer Store", "GamerStorePlus", "GamerStore+"],
        "description": "Platform top up game dan voucher digital terpercaya, termurah, dan instan.",
        "inLanguage": "id-ID"
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "GamerStore Plus",
        "alternateName": ["GamerStore", "GamerStorePlus"],
        "url": baseUrl,
        "logo": `${baseUrl}/favicon.svg`,
        "sameAs": []
      }
    ]
  };

  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
