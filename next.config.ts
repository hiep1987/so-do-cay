import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  ...(isProd && { basePath: '/so-do-cay' }),
};

export default nextConfig;
