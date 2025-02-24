import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Don't fail builds on type errors during development
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
      bodySizeLimit: "2mb"
    },
  }
};

export default nextConfig;
