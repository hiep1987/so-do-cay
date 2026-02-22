import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/so-do-cay' : '';

const nextConfig: NextConfig = {
  output: 'export',
  ...(isProd && { basePath }),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
