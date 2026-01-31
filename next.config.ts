import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.genflow.com",
      },
      {
        protocol: "https",
        hostname: "images.sproutvideo.com",
      },
      {
        protocol: "https",
        hostname: "api-files.sproutvideo.com",
      },
    ],
  },
};

export default nextConfig;
