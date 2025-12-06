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
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

module.exports = nextConfig;
