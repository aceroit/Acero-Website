function buildUploadsRemotePattern(urlString) {
  if (!urlString) {
    return null
  }

  try {
    const parsed = new URL(urlString)
    return {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
      pathname: '/uploads/**',
    }
  } catch (error) {
    return null
  }
}

const remotePatterns = [
  buildUploadsRemotePattern(process.env.NEXT_PUBLIC_UPLOAD_BASE || 'http://localhost:4000/uploads'),
  buildUploadsRemotePattern(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  buildUploadsRemotePattern(
    process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:4000'
  ),
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
  {
    protocol: 'https',
    hostname: 'api.acerogroup.co',
    pathname: '/uploads/**',
  },
  {
    protocol: 'http',
    hostname: 'localhost',
    port: '4000',
    pathname: '/uploads/**',
  },
  {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: '4000',
    pathname: '/uploads/**',
  },
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
    pathname: '/**',
  },
].filter(Boolean)

const uniqueRemotePatterns = remotePatterns.filter((pattern, index, allPatterns) => {
  const signature = JSON.stringify(pattern)
  return index === allPatterns.findIndex((item) => JSON.stringify(item) === signature)
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/career',
        destination: '/careers',
        permanent: true,
      },
      {
        source: '/media/company-update',
        destination: '/media/company-updates',
        permanent: true,
      },
      {
        source: '/media/company-update/:slug',
        destination: '/media/company-updates/:slug',
        permanent: true,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: uniqueRemotePatterns,
  },
}

export default nextConfig
