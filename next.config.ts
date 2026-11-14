import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  turbopack: { root: process.cwd() },
  experimental: { agentUpgrade: "security" },
};

export default nextConfig;
