import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Prisma must not be bundled into serverless routes; avoids runtime errors on Vercel. */
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
