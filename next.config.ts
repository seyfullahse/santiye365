import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone çıktı Docker dağıtımı için daha hafif image üretir
  output: "standalone",
};

export default nextConfig;
