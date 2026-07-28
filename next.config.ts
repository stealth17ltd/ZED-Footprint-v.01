import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js not to bundle these packages — they rely on worker files and
  // native paths that break when Turbopack renames/inlines them.
  // @react-pdf/renderer uses worker-level APIs (canvas, stream) that must
  // run in native Node.js — not bundled by Turbopack/Webpack.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@react-pdf/renderer'],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;
