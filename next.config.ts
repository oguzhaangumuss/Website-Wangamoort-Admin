import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'wangamoort-product-images.s3.eu-north-1.amazonaws.com'
    ]
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
};

export default nextConfig;

