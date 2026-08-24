import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gamerstoreplus.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/api/uploads/",
          "/favicon.ico",
          "/favicon.svg",
          "/icon",
          "/apple-icon",
        ],
        disallow: ["/admin/", "/profile", "/orders"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/api/uploads/", "/public/"],
      },
      {
        userAgent: "Google-Favicon",
        allow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
