import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@movie-night/domain": path.resolve(__dirname, "packages/domain/src/index.ts"),
      "@movie-night/domain/": path.resolve(__dirname, "packages/domain/src/"),
      "@movie-night/ui": path.resolve(__dirname, "packages/ui/src/index.tsx"),
      "@movie-night/ui/": path.resolve(__dirname, "packages/ui/src/")
    }
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"]
  }
});

