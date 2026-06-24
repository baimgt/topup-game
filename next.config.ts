import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Paksa Mongoose, MongoDB driver, dan bcrypt jalan di server saja
  // Mencegah error "Can't resolve 'net', 'tls', 'dns'" saat bundling
  serverExternalPackages: ["mongoose", "mongodb", "bcryptjs", "jsonwebtoken"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.digiflazz.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

export default nextConfig;
