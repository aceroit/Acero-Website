const DEFAULT_UPLOAD_BASE = 'http://localhost:4000/uploads';
const DEFAULT_SITE_URL = 'http://localhost:3000';

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function getUploadBase() {
  return trimTrailingSlash(import.meta.env.VITE_UPLOAD_BASE || DEFAULT_UPLOAD_BASE);
}

function getSiteUrl() {
  return trimTrailingSlash(import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL);
}

function extractRawMediaValue(input) {
  if (!input) return '';

  if (typeof input === 'string') {
    return input;
  }

  if (typeof input !== 'object') {
    return '';
  }

  return (
    input.url ||
    input.secureUrl ||
    input.secure_url ||
    input.imageUrl ||
    input.thumbnailUrl ||
    input.fileUrl ||
    input.publicId ||
    input.public_id ||
    ''
  );
}

export function getCmsAssetUrl(input) {
  const rawValue = extractRawMediaValue(input);
  if (!rawValue) return '';

  const value = String(rawValue).trim();
  if (!value) return '';

  const lower = value.toLowerCase();
  const uploadBase = getUploadBase();
  const siteUrl = getSiteUrl();

  const legacyPrefixes = [
    'https://acero.ae/public/uploads/',
    'http://acero.ae/public/uploads/',
    'https://www.acero.ae/public/uploads/',
    'http://www.acero.ae/public/uploads/',
  ];

  for (const prefix of legacyPrefixes) {
    if (lower.startsWith(prefix)) {
      const relativePath = value.slice(prefix.length);
      return `${uploadBase}/${relativePath.replace(/^\/+/, '')}`;
    }
  }

  if (lower.startsWith('/public/uploads/')) {
    return `${uploadBase}/${value.replace(/^\/?public\/uploads\//i, '')}`;
  }

  if (lower.startsWith('public/uploads/')) {
    return `${uploadBase}/${value.replace(/^public\/uploads\//i, '')}`;
  }

  if (value.startsWith('/uploads/')) {
    return `${uploadBase}/${value.replace(/^\/uploads\//, '')}`;
  }

  if (value.startsWith('uploads/')) {
    return `${uploadBase}/${value.replace(/^uploads\//, '')}`;
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${siteUrl}${value}`;
  }

  return `${uploadBase}/${value.replace(/^\/+/, '')}`;
}

export function normalizeMediaObject(media) {
  if (!media || typeof media !== 'object') return media;

  const normalizedUrl = getCmsAssetUrl(media);
  if (!normalizedUrl) return media;

  return {
    ...media,
    url: normalizedUrl,
    secureUrl: normalizedUrl,
    secure_url: normalizedUrl,
  };
}
