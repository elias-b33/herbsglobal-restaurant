import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Check the application and Next's generated route types, without compiling
  // the separate Cloudflare build tools or the offline export's virtual modules.
  typescript: { tsconfigPath: "tsconfig.next.json" },
};

export default nextConfig;
