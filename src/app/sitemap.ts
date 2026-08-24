import { MetadataRoute } from "next";
  import { connectDB } from "@/lib/mongoose";
  import Game from "@/models/Game";

  export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gamerstoreplus.com";

    // Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/games`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/order/check`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/leaderboard`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      },
    ];

    // Dynamic game routes
    let gameRoutes: MetadataRoute.Sitemap = [];
    try {
      await connectDB();
      const games = await Game.find({ isActive: true }).select("slug updatedAt").lean();
      gameRoutes = games.map((game: any) => ({
        url: `${baseUrl}/games/${game.slug}`,
        lastModified: game.updatedAt ? new Date(game.updatedAt) : new Date(),
        changeFrequency: "daily",
        priority: 0.85,
      }));
    } catch (error) {
      console.error("Failed to generate dynamic game sitemaps:", error);
    }

    return [...staticRoutes, ...gameRoutes];
  }
