const DEFAULT_UPLOAD_BASE = 'http://localhost:4000/uploads'
const DEFAULT_SITE_ORIGIN = 'http://localhost:3000'
const DEFAULT_API_ORIGIN = 'http://localhost:4000'

// Central URL normalizer for every CMS/admin uploaded asset rendered by the Next frontend.
// DB values may be full URLs, /uploads paths, legacy migrated paths, or bare publicIds.
// Components should call getCmsAssetUrl/normalizeCmsAssetUrls instead of building URLs inline.
const DIRECT_ASSET_KEYS = new Set([
  'image',
  'imageUrl',
  'image_url',
  'src',
  'thumbnail',
  'thumbnailUrl',
  'thumbnail_url',
  'mobileImage',
  'mobilePopupImage',
  'videoThumbnail',
  'videoThumbnailUrl',
  'banner',
  'featureImage',
  'featuredImage',
  'brochureImage',
  'customerImage',
  'certificationImage',
  'metaImage',
  'thumbnailImage',
  'logo',
  'logoUrl',
  'coverImage',
])

const URL_LIKE_ASSET_KEYS = new Set([
  'url',
  'secureUrl',
  'secure_url',
  'publicId',
  'public_id',
  'fileUrl',
  'downloadLink',
])

const ASSET_ARRAY_KEYS = new Set(['images', 'gallery'])

const UPLOAD_PUBLIC_ID_PREFIXES = [
  'migrated/',
  'acero-cms/',
  'career-applications/',
  'uploads/',
  'all/',
]

const ASSET_EXTENSION_PATTERN =
  /\.(avif|bmp|doc|docx|gif|ico|jpe?g|mp4|mov|mpeg|mpg|pdf|png|ppt|pptx|svg|txt|webm|webp|xls|xlsx)$/i

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function getUploadBase(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_UPLOAD_BASE || DEFAULT_UPLOAD_BASE)
}

function getSiteOrigin(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_ORIGIN)
}

function getApiOrigin(): string {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      DEFAULT_API_ORIGIN
  )
}

function parseUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch (error) {
    return null
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized === '::1'
  )
}

function isSameOrigin(left: URL | null, right: URL | null): boolean {
  if (!left || !right) {
    return false
  }

  const leftPort = left.port || (left.protocol === 'https:' ? '443' : '80')
  const rightPort = right.port || (right.protocol === 'https:' ? '443' : '80')

  return (
    left.protocol === right.protocol &&
    left.hostname.toLowerCase() === right.hostname.toLowerCase() &&
    leftPort === rightPort
  )
}

function extractUploadsRelativePath(value: string): string | null {
  if (value.startsWith('/uploads/')) {
    return value.substring('/uploads/'.length).replace(/^\/+/, '')
  }

  if (value.startsWith('uploads/')) {
    return value.substring('uploads/'.length).replace(/^\/+/, '')
  }

  const parsed = parseUrl(value)
  if (!parsed) {
    return null
  }

  const marker = '/uploads/'
  const markerIndex = parsed.pathname.indexOf(marker)

  if (markerIndex === -1) {
    return null
  }

  return parsed.pathname.substring(markerIndex + marker.length).replace(/^\/+/, '')
}

function extractLegacyUploadRelativePath(value: string): string | null {
  const normalizedValue = value.replace(/\\/g, '/')
  const lowerValue = normalizedValue.toLowerCase()

  const relativePrefixes = [
    '/public/uploads/',
    'public/uploads/',
    '/storage/app/public/',
    'storage/app/public/',
  ]

  for (const prefix of relativePrefixes) {
    if (lowerValue.startsWith(prefix)) {
      return normalizedValue.slice(prefix.length).replace(/^\/+/, '')
    }
  }

  const parsed = parseUrl(normalizedValue)
  if (!parsed) {
    return null
  }

  const legacyPathMarkers = ['/public/uploads/', '/storage/app/public/']
  const lowerPathname = parsed.pathname.toLowerCase()

  for (const marker of legacyPathMarkers) {
    const markerIndex = lowerPathname.indexOf(marker)
    if (markerIndex !== -1) {
      return parsed.pathname.substring(markerIndex + marker.length).replace(/^\/+/, '')
    }
  }

  return null
}

function buildUploadUrl(relativePath: string): string {
  const normalizedPath = relativePath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^uploads\/+/, '')

  return `${getUploadBase()}/${normalizedPath}`
}

function looksLikeUploadPublicId(value: string): boolean {
  const normalizedValue = value.replace(/\\/g, '/').replace(/^\/+/, '')

  if (!normalizedValue) {
    return false
  }

  if (UPLOAD_PUBLIC_ID_PREFIXES.some((prefix) => normalizedValue.startsWith(prefix))) {
    return true
  }

  return normalizedValue.includes('/') && ASSET_EXTENSION_PATTERN.test(normalizedValue)
}

function extractAssetCandidate(value: unknown): string | null {
  if (typeof value === 'string') {
    return value
  }

  if (!isPlainObject(value)) {
    return null
  }

  const candidateKeys = [
    'url',
    'secureUrl',
    'secure_url',
    'imageUrl',
    'thumbnailUrl',
    'fileUrl',
    'downloadLink',
    'publicId',
    'public_id',
  ]

  for (const key of candidateKeys) {
    const candidate = value[key]
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  return null
}

function shouldNormalizeFullUploadUrl(value: string): boolean {
  const parsedValue = parseUrl(value)
  if (!parsedValue) {
    return false
  }

  const uploadPath = extractUploadsRelativePath(value)
  if (!uploadPath) {
    return false
  }

  const uploadBaseUrl = parseUrl(getUploadBase())
  if (isSameOrigin(parsedValue, uploadBaseUrl)) {
    return false
  }

  const apiOriginUrl = parseUrl(getApiOrigin())
  if (isSameOrigin(parsedValue, apiOriginUrl)) {
    return true
  }

  return isLoopbackHostname(parsedValue.hostname)
}

export function getImageUrl(input?: string | null): string {
  if (!input) {
    return '/placeholder.svg'
  }

  const value = String(input).trim()
  if (!value) {
    return '/placeholder.svg'
  }

  const legacyUploadPath = extractLegacyUploadRelativePath(value)
  if (legacyUploadPath) {
    return buildUploadUrl(legacyUploadPath)
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    const relativeUploadPath = extractUploadsRelativePath(value)

    if (relativeUploadPath && shouldNormalizeFullUploadUrl(value)) {
      return buildUploadUrl(relativeUploadPath)
    }

    return value
  }

  const relativeUploadPath = extractUploadsRelativePath(value)
  if (relativeUploadPath) {
    return buildUploadUrl(relativeUploadPath)
  }

  if (looksLikeUploadPublicId(value)) {
    return buildUploadUrl(value)
  }

  if (value.startsWith('/')) {
    return value
  }

  return value
}

export function getCmsAssetUrl(value: unknown, fallback = ''): string {
  const candidate = extractAssetCandidate(value)
  if (!candidate) {
    return fallback
  }

  const resolved = getImageUrl(candidate)
  return resolved || fallback
}

function looksLikeAssetObject(record: Record<string, unknown>): boolean {
  return Object.keys(record).some(
    (key) => DIRECT_ASSET_KEYS.has(key) || URL_LIKE_ASSET_KEYS.has(key)
  )
}

function normalizeCmsAssetUrlsInternal<T>(
  value: T,
  currentKey?: string,
  parentIsAssetObject = false
): T {
  if (typeof value === 'string') {
    const shouldNormalize =
      !!currentKey &&
      (DIRECT_ASSET_KEYS.has(currentKey) ||
        URL_LIKE_ASSET_KEYS.has(currentKey) ||
        parentIsAssetObject)

    return (shouldNormalize ? getImageUrl(value) : value) as T
  }

  if (Array.isArray(value)) {
    const treatItemsAsAssets =
      parentIsAssetObject || (!!currentKey && ASSET_ARRAY_KEYS.has(currentKey))

    return value.map((item) =>
      normalizeCmsAssetUrlsInternal(item, currentKey, treatItemsAsAssets)
    ) as T
  }

  if (!isPlainObject(value)) {
    return value
  }

  const record = value as Record<string, unknown>
  const assetObject = parentIsAssetObject || looksLikeAssetObject(record)
  const normalizedEntries = Object.entries(record).map(([key, entryValue]) => {
    const nextParentIsAsset =
      DIRECT_ASSET_KEYS.has(key) ||
      (assetObject && URL_LIKE_ASSET_KEYS.has(key))

    return [key, normalizeCmsAssetUrlsInternal(entryValue, key, nextParentIsAsset)]
  })

  const normalizedRecord = Object.fromEntries(normalizedEntries) as Record<string, unknown>

  if (assetObject) {
    const resolvedUrl = getCmsAssetUrl(normalizedRecord)
    if (resolvedUrl) {
      if (!normalizedRecord.url) {
        normalizedRecord.url = resolvedUrl
      }
      if (!normalizedRecord.secureUrl && !normalizedRecord.secure_url) {
        normalizedRecord.secureUrl = resolvedUrl
      }
    }
  }

  return normalizedRecord as T
}

export function normalizeCmsAssetUrls<T>(value: T): T {
  // Public API responses often contain nested section content. Normalize the
  // whole object once at the service boundary so rendering components stay simple.
  return normalizeCmsAssetUrlsInternal(value)
}

export function getSiteUrl(pathname = ''): string {
  if (!pathname) {
    return getSiteOrigin()
  }

  if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
    return pathname
  }

  if (pathname.startsWith('/')) {
    return `${getSiteOrigin()}${pathname}`
  }

  return `${getSiteOrigin()}/${pathname}`
}
