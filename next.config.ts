import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Paksa Mongoose, MongoDB driver, dan bcrypt jalan di server saja
  // Mencegah error "Can't resolve 'net', 'tls', 'dns'" saat bundling
  serverExternalPackages: ["mongoose", "mongodb", "bcryptjs", "jsonwebtoken"],

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.digiflazz.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
