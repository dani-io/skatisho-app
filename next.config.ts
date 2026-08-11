import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // No `images.remotePatterns`: every image is same-origin now, served by
  // app/media/[...key]. The entry that used to be here allowed
  // https://cdn.skatisho.com, a host that never had a DNS record — it permitted
  // an origin nothing could load. Same-origin URLs need no allowlist, and
  // nothing in the app uses next/image today in any case.
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
