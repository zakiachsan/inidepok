import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "inidepok.com",
      },
      {
        protocol: "https",
        hostname: "*.inidepok.com",
      },
    ],
  },
};

export default nextConfig;
