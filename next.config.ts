import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coinicons-api.vercel.app',
        port: '',
        pathname: '/api/icon/**',
      },
      {
        protocol: 'https',
        hostname: 'img.logokit.com',
        port: '',
        pathname: '/token/**',
      },
    ],
  },
};

export default nextConfig;
