import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Don't fail builds on type errors during development
    ignoreBuildErrors: true,
  },
  experimental: {
    // Enable the new App Router
    appDir: true,
  }
};

export default nextConfig;
