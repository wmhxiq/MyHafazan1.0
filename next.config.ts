import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config: any) => {
    config.resolve.alias.canvas = false
    return config
  },

  experimental:{
    serverActions:{
      allowedOrigins: ['localhost:3000'],
    }
  }
  
};

export default nextConfig;

// next.config.js
module.exports = {
  allowedDevOrigins: ['10.79.199.254'],
};