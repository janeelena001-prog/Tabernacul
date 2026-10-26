import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: { "/**": ["./db/deploy-seed.db"] },
  // Pin the workspace root so Next doesn't infer it from stray lockfiles
  // higher up the tree (e.g. C:\Users\...\package-lock.json).
  turbopack: {
    root: __dirname,
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
