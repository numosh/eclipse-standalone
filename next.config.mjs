/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'jspdf', 'jspdf-autotable'],
    // Skip pre-rendering for API routes
    isrMemoryCacheSize: 0,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic browser-only modules from server bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        'pdfjs-dist': false,
        'html2canvas': false,
      }
    }
    return config
  },
};

export default nextConfig;
