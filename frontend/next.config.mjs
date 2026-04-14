/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    // Allow project/industry/building-type images from backend (acero.ae, localhost, cloudinary)
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
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
