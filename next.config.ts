import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Only the public CDN. Private media never has a remote URL to optimise.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.skatisho.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
    // Upload routes are excluded from the proxy matcher precisely so their
    // bodies are never cloned into memory; nothing that still passes through
    // proxy needs a large body, so this stays at the default.
    proxyClientMaxBodySize: "1mb",
  },
};

export default nextConfig;
