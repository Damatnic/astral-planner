const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog', 
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
    clientTraceMetadata: ['userId'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          lucide: {
            name: 'lucide',
            test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          radix: {
            name: 'radix',
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            chunks: 'all',
            priority: 25,
          },
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/](?!(lucide-react|@radix-ui))/,
            chunks: 'all',
            priority: 20,
          },
        },
      }
    }
    return config
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate' }
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      }
    ]
  }
}

module.exports = withBundleAnalyzer(
  withSentryConfig(nextConfig, {
    silent: true,
    hideSourceMaps: true,
    disableLogger: true,
  })
)