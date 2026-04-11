import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse / pdfjs-dist run in Node; avoid bundling issues in API routes
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth", "jszip", "node-ical"],
};

export default nextConfig;
