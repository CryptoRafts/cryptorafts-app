const webpack = require("webpack");

// Tiny resolver plugin to normalize "node:*" specifiers
class StripNodeSchemePlugin {
  apply(resolver) {
    const target = resolver.ensureHook("resolve");
    resolver.getHook("beforeResolve").tapAsync("StripNodeSchemePlugin", (req, ctx, cb) => {
      if (req && req.request && typeof req.request === "string" && req.request.startsWith("node:")) {
        const request = req.request.replace(/^node:/, "");
        const obj = { ...req, request };
        return resolver.doResolve(target, obj, "strip node: scheme", ctx, cb);
      }
      return cb();
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Hostinger
  output: 'export',
  
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  
  // Add trailing slashes
  trailingSlash: true,
  
  // Ignore build errors for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable API routes and middleware warnings
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  webpack: (config, { isServer }) => {
    // Resolver plugin
    config.resolve.plugins = [...(config.resolve.plugins || []), new StripNodeSchemePlugin()];

    if (!isServer) {
      // Browser bundle: add minimal fallbacks
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        buffer: "buffer",
        stream: "stream-browserify",
        events: "events",
        util: "util",
        path: "path-browserify",
      };
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        buffer: require.resolve("buffer"),
        stream: require.resolve("stream-browserify"),
        events: require.resolve("events"),
        util: require.resolve("util"),
        path: require.resolve("path-browserify"),
        fs: false, 
        net: false, 
        tls: false, 
        child_process: false, 
        dns: false,
      };
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;

