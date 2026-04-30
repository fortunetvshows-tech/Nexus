import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Next from inferring the wrong workspace root when multiple
    // lockfiles exist on the machine (can break routes/assets/CSS in deploys).
    root: __dirname,
  },
};

export default nextConfig;
