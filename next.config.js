// Catalyst Performance Configuration - Blazing Fast Bundle Optimization
const { withSentryConfig } = require('@sentry/nextjs')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  disableDevLogs: true,
  maximumFileSizeToCacheInBytes: 5000000,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60,
          purgeOnQuotaError: true
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60,
          purgeOnQuotaError: true
        }
      }
    },
    {
      urlPattern: /\/_next\/image\?url=.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          purgeOnQuotaError: true
        }
      }
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60,
          purgeOnQuotaError: true
        }
      }
    },
    {
      urlPattern: /^https:\/\/.*\.(woff2|woff|ttf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60,
          purgeOnQuotaError: true
        }
      }
    }
  ]
})
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  outputFileTracingRoot: __dirname,
  
  experimental: {
    // Aggressive package optimization with tree shaking
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
      '@radix-ui/react-toast',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-separator',
      '@radix-ui/react-avatar',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-slider',
      '@radix-ui/react-tooltip',
      'framer-motion',
      '@tanstack/react-query',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
      'react-window',
      'react-hook-form',
      'cmdk'
    ],
    // Enable modern bundling
    esmExternals: true,
    // Optimize CSS with lightning CSS
    optimizeCss: true,
  },
  
  // Turbo configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
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
    // Suppress critical dependency warnings from Prisma instrumentation
    config.ignoreWarnings = [
      {
        module: /node_modules\/@prisma\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      path: false,
      stream: false,
      crypto: false,
      os: false,
      util: false,
      assert: false,
      buffer: false,
      url: false,
      querystring: false
    };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': './src'
      };
      
      // Catalyst's Aggressive Bundle Splitting Strategy
      if (config.optimization && config.optimization.splitChunks) {
        config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 200000,
          maxAsyncRequests: 10,
          maxInitialRequests: 6,
          automaticNameDelimiter: '-',
          cacheGroups: {
            default: false,
            vendors: false,
            // Critical UI components - Load first
            criticalUI: {
              name: 'critical-ui',
              test: /[\\/]node_modules[\\/](@radix-ui\/(react-dialog|react-dropdown-menu|react-tabs|react-toast))[\\/]/,
              chunks: 'all',
              priority: 50,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Icons - Lazy load
            icons: {
              name: 'icons',
              test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
              chunks: 'async',
              priority: 40,
              reuseExistingChunk: true,
            },
            // Charts - Async load only when needed
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
              chunks: 'async',
              priority: 35,
              reuseExistingChunk: true,
            },
            // Form handling
            forms: {
              name: 'forms',
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform)[\\/]/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Date utilities
            dates: {
              name: 'dates',
              test: /[\\/]node_modules[\\/](date-fns|react-day-picker)[\\/]/,
              chunks: 'all',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Animation libraries
            animation: {
              name: 'animation',
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              chunks: 'async',
              priority: 20,
              reuseExistingChunk: true,
            },
            // React Query
            query: {
              name: 'react-query',
              test: /[\\/]node_modules[\\/](@tanstack\/react-query)[\\/]/,
              chunks: 'all',
              priority: 18,
              reuseExistingChunk: true,
            },
            // Utilities
            utils: {
              name: 'utils',
              test: /[\\/]node_modules[\\/](clsx|class-variance-authority|tailwind-merge)[\\/]/,
              chunks: 'all',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Common vendor libraries
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              minChunks: 2,
              maxSize: 150000,
            },
          },
        };
      }
      
      // Tree shaking improvements
      config.resolve.mainFields = ['module', 'main'];
    }

    // Enable webpack caching with better error handling
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
      compression: 'gzip',
      hashAlgorithm: 'xxhash64',
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

// Catalyst Production Export - All Optimizations Enabled
module.exports = withBundleAnalyzer(
  withPWA(
    withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  )
)