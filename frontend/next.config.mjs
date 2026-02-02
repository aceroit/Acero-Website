/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    // Allow project/industry/building-type images from backend (acero.ae or localhost)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'acero.ae',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'acero.ae',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
