import type { NextConfig } from "next";

const productionOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        ...(productionOrigin ? [productionOrigin] : []),
      ],
    },
  },
};

export default nextConfig;
