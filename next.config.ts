import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Use regular Next.js build (not static export) to support API routes
  // ...(isDev ? {} : { output: 'export' }),
  trailingSlash: true,
  // Exclude API routes from static export
  outputFileTracingExcludes: {
    '*': ['./src/app/api_backup/**/*']
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'play.pokemonshowdown.com',
        port: '',
        pathname: '/sprites/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sprites.pmdcollab.org',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Remove Firebase environment variables for static deployment
  // Ensure environment variables are available at build time
  generateBuildId: async () => {
    return 'pokemon-app-build'
  },
};

export default nextConfig;
