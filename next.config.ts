import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: [
      'xftjumejicbxbaoqfugj.supabase.co',
      // add other domains if needed
    ],
  },
};

export default nextConfig;
