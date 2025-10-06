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
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed outputFileTracingRoot to fix Vercel deployment path issue
  
  serverExternalPackages: [
    '@neondatabase/serverless',
    'winston',
    'winston-daily-rotate-file',
    'pusher'
  ],
  
  // Force all API routes to be dynamic
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  
  typescript: {
    // Enabled type checking for better code quality
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Enabled ESLint for better code quality
    ignoreDuringBuilds: false,
  },
  
  images: {
    formats: ['image/avif', 'image/webp'],
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
          }
        ]
      }
    ];
  },

  webpack: (config, { isServer }) => {
    // Simplified webpack configuration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        winston: false,
      };
    }

    return config;
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  transpileClientSDK: true,
  hideSourceMaps: true,
  disableLogger: true,
}

module.exports = withBundleAnalyzer(
  withPWA(
    process.env.SENTRY_AUTH_TOKEN 
      ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
      : nextConfig
  )
)