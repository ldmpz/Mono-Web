import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
    ],
  },
  // Exclude @react-pdf/renderer and related libs from server bundle
  // These use native Node.js modules incompatible with webpack bundling
  serverExternalPackages: [
    "@react-pdf/renderer",
    "@react-pdf/font",
    "@react-pdf/image",
    "@react-pdf/layout",
    "@react-pdf/pdfkit",
    "@react-pdf/reconciler",
    "@react-pdf/stylesheet",
    "@react-pdf/textkit",
    "@react-pdf/types",
    "pdfkit",
    "fontkit",
    "png-js",
    "linebreak",
  ],
  webpack: (config: Configuration) => {
    // Prevent webpack from attempting to bundle canvas/native dependencies
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      {
        "@react-pdf/renderer": "commonjs @react-pdf/renderer",
        "canvas": "commonjs canvas",
      },
    ];
    return config;
  },
};

export default nextConfig;
