import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/heavy server-only packages — keep them out of the bundle.
  serverExternalPackages: ["mongoose", "bcryptjs"],
  eslint: {
    // Lint runs separately via `npm run lint` / CI — don't block builds.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors still fail the build (tsc runs in CI via `npm run typecheck`).
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
