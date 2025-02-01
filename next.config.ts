import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'wangamoort-product-images.s3.eu-north-1.amazonaws.com'
    ],
    unoptimized: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@admin': path.join(__dirname, 'src'),
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  }
};

export default nextConfig;

