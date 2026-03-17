import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@privy-io/server-auth"],
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
