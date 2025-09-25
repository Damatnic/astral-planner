// Temporarily disabled for debugging
// const { withSentryConfig } = require('@sentry/nextjs')
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// })
// const withPWA = require('next-pwa')(...)

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast'
    ],
  },
  
  serverExternalPackages: ['@neondatabase/serverless'],
  
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com'
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev'
      }
    ]
  },
  
  compress: true,
  poweredByHeader: false,
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },

  webpack: (config, { isServer, webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false
    };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': './src'
      };
      
      // Optimize bundle splitting
      if (config.optimization && config.optimization.splitChunks) {
        config.optimization.splitChunks.cacheGroups = {
          default: false,
          vendors: false,
          lucide: {
            name: 'lucide',
            test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
          },
          radix: {
            name: 'radix',
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
          },
          recharts: {
            name: 'recharts',
            test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            minChunks: 2,
          },
        };
      }
      
      // Tree shaking improvements
      config.resolve.mainFields = ['module', 'main'];
    }

    // Enable webpack caching
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };

    return config;
  },

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  }
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
}

// Simplified export for debugging
module.exports = nextConfig

// Original complex export:
// module.exports = withBundleAnalyzer(
//   withSentryConfig(
//     withPWA(nextConfig),
//     sentryWebpackPluginOptions
//   )
// )