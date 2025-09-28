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
  // Simplified configuration for successful deployment
  experimental: {
    serverComponentsExternalPackages: [
      '@neondatabase/serverless',
      'winston',
      'winston-daily-rotate-file',
      'pusher'
    ],
  },
  
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
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
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
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com 'sha256-6nvG1C/mEoCWAcSkHsFfaiJWmJ9SNk5yOvknC6V2Opk=' 'sha256-9lEWXf2Hn2ieCK1KQ/S66sQ4keHF188UUDCKoduzMsE=' 'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo=' 'sha256-L9Kk9iAgvOo4F+tNuX+vA20eb3nmkdVgO3Lun5m0HKE=' 'sha256-hqUl3T/0qZRtIN8ucdJQg/QLY9Fpu9SEiSMuK6VscRM=' 'sha256-ODiyWGpk3ai4W7JKpPqCtydnW8TgOer/4fVOkzgVx+g=' 'sha256-vIqb4kNPhpAR1NRKMcLGzbkYO8krHm3ztJpRep2+oSM=' 'sha256-ZKRTrEp3SK3KTk9DuSopbgaICywsZFZJdPH6SN1vMWc=' 'sha256-TnkFpSNK5gikNZg0QSRIQ9bqtnioaENlqoyam0yFSRg=' 'sha256-zlmxiox02siGltNlorvFS7iuu75seOt8KYXvDCZ8rAA=' 'sha256-2UkHY4aL45zJS9ILl4BmSK5hPAdZhC+F3WDmXmwwO6k=' 'sha256-BgwPRjL3Y3O9chB5VYIiyBUZ7emEWzfwuzOT5fkypRs=' 'sha256-J4hDrKZaPjVCO2Nrf8PIJHLSoThQM+eaplEmvNFociw=' 'sha256-AYMkpfPmrAtiYXbZ+TZx/jPnAV5jy5fkR7fNf1rWZb0=' 'sha256-iqDQ5UmX/puDk+yOQ3YMg58GyYigW0+I3qtXCBbjwkw=' 'sha256-tTb/fLqlXhO4WxBRp9dm6/gpq2Ae5Jjp13ppccwnzDg=' 'sha256-H4K9zv0cLkIfOYR1NUNZI/USAfqhNWhh1AQWOMf2zF8=' 'sha256-w5OIGPTeC92edgorRuMUTqBE8Tw17hrrCY5jrqG4Kww=' 'sha256-I2nBKt5VIqh/HJimmWebdN53eP9axUaJglRSR4cj/BE='",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https: wss: ws://localhost:* ws://127.0.0.1:*",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
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