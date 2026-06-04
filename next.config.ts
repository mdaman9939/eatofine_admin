import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  devIndicators: false,
  // Allow `next/image` to load images served by the backend (local + deployed).
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "3000" },
      { protocol: "http", hostname: "localhost", port: "3000" },
      { protocol: "https", hostname: "eatofine-backend.onrender.com" },
    ],
  },
};

export default nextConfig;
