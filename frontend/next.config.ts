import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal self-contained server in .next/standalone for Docker
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
