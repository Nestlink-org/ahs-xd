import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.100.149"],
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb", // Allow large video uploads
    },
  },
};

export default nextConfig;
