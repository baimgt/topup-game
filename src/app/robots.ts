import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gamerstoreplus.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/uploads/"],
        disallow: ["/admin/", "/api/", "/profile", "/orders"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
