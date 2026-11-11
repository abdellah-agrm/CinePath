import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Autoriser les connexions depuis les smartphones et appareils du réseau local
  allowedDevOrigins: [
    "192.168.0.101",
    "192.168.0.*",
    "192.168.1.*",
    "192.168.*.*",
    "10.0.*.*",
    "*.local",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

