/** @type {import('next').NextConfig} */

const nextConfig = {
    webpack(config, { isServer }) {
      // Add SVG rule for client-side rendering
      config.module.rules.push({
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/, // Apply to JS/TS/TSX files
        use: ['@svgr/webpack'],
      });
  
      return config;
    },
  };
  
  export default nextConfig;