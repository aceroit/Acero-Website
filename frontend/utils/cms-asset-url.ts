function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
  return baseUrl.replace(/\/$/, '')
}

function isLocalApiBase(): boolean {
  const baseUrl = getApiBaseUrl().toLowerCase()
  return (
    baseUrl.includes('localhost') ||
    baseUrl.includes('127.0.0.1') ||
    baseUrl.includes('0.0.0.0')
  )
}

function buildLocalUploadsBase(): string {
  return getApiBaseUrl().replace(/\/api\/?$/, '')
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '0.0.0.0'
}

export function resolveCmsAssetUrl(url?: string | null): string {
  if (!url) return ''

  if (url.startsWith('/uploads/')) {
    return isLocalApiBase() ? `${buildLocalUploadsBase()}${url}` : url
  }

  try {
    const parsed = new URL(url)
    const uploadsIndex = parsed.pathname.indexOf('/uploads/')
    if (uploadsIndex === -1) {
      return url
    }

    if (!isLocalApiBase() || !isLocalHostname(parsed.hostname)) {
      return url
    }

    return `${buildLocalUploadsBase()}${parsed.pathname.substring(uploadsIndex)}`
  } catch (error) {
    return url
  }
}

export function normalizeCmsAssetUrls<T>(value: T): T {
  if (typeof value === 'string') {
    return resolveCmsAssetUrl(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeCmsAssetUrls(item)) as T
  }

  if (value && Object.prototype.toString.call(value) === '[object Object]') {
    const normalizedEntries = Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key,
      normalizeCmsAssetUrls(entryValue),
    ])

    return Object.fromEntries(normalizedEntries) as T
  }

  return value
}
