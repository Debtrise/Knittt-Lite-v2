/** @type {import('next').NextConfig} */
const nextConfig = {
  // Additional security and performance configurations
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Apply CORS headers for API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://contact.knittt.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },

  // Redirect configuration
  async redirects() {
    return [
      // Redirect HTTP to HTTPS in production
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://contact.knittt.com/:path*',
        permanent: true,
      },
    ];
  },

  // Rewrite configuration for API proxying to external backend
  async rewrites() {
    return [
      // Proxy API calls to your HTTPS backend server
      {
        source: '/api/:path*',
        destination: 'https://api.knittt.com/api/:path*', // Your HTTPS backend server
      },
    ];
  },

  // Image optimization settings
  images: {
    domains: ['contact.knittt.com', 'api.knittt.com'],
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'contact.knittt.com',
      },
      {
        protocol: 'https',
        hostname: 'api.knittt.com',
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable if you need server actions (Next.js 14+)
    serverActions: {
      allowedOrigins: ['contact.knittt.com', 'api.knittt.com'],
    },
  },

  // Environment variables that should be available to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://api.knittt.com/api' 
      : 'http://localhost:3001/api',
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Webpack configuration for production optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
