/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
