/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'acerogroup.co',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.acerogroup.co',
        pathname: '/uploads/**',
      },
    ],
  },
}

export default nextConfig
