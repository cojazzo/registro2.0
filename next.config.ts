import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost:3000", "192.168.1.68:3000", "192.168.1.68", "100.64.138.49:3000"]
};

export default nextConfig;
