/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.bytedance.com',
      },
      {
        protocol: 'https',
        hostname: '**.alibaba.com',
      },
      {
        protocol: 'https',
        hostname: '**.openai.com',
      },
      {
        protocol: 'https',
        hostname: '**.microsoft.com',
      },
    ],
  },
};

module.exports = nextConfig;
