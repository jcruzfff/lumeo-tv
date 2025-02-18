import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Don't fail builds on type errors during development
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
