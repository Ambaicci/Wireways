import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // This drastically speeds up Next.js dev server compilation 
    // by only loading the specific icons and motion components you use,
    // rather than parsing the entire libraries on every hot-reload.
    optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-icons"],
  },
};

export default nextConfig;