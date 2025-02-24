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
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/ws',
        headers: [
          {
            key: 'Upgrade',
            value: 'websocket',
          },
          {
            key: 'Connection',
            value: 'Upgrade',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
