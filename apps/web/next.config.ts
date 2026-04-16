import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "image.tmdb.org",
        protocol: "https"
      }
    ]
  },
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: ["@movie-night/domain", "@movie-night/ui"]
};

export default nextConfig;
