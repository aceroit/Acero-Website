const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const os = require("os")

// Upload storage contract:
// - UPLOAD_ROOT is the physical folder where files are written.
// - PUBLIC_UPLOAD_BASE is the browser URL that exposes that folder.
// Local example: D:/Acero-Website/uploads -> http://localhost:4000/uploads
// Hostinger example: /var/www/cms/acero-uploads -> https://acerogroup.co/uploads
function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_ROOT || path.join(__dirname, "..", "uploads"))
}

function getPublicUploadBase() {
  return (process.env.PUBLIC_UPLOAD_BASE || "http://localhost:4000/uploads").replace(/\/+$/, "")
}

function getUploadTempDir() {
  return path.resolve(process.env.UPLOAD_TEMP_DIR || path.join(os.tmpdir(), "acero-uploads"))
}

function getRelativeUploadPath(input = "") {
  const value = String(input || "").trim()

  if (!value) {
    return null
  }

  if (value.startsWith("/uploads/")) {
    return value.substring("/uploads/".length).replace(/^\\+|^\/+/, "")
  }

  try {
    const parsed = new URL(value)
    const marker = "/uploads/"
    const markerIndex = parsed.pathname.indexOf(marker)

    if (markerIndex === -1) {
      return null
    }

    return parsed.pathname.substring(markerIndex + marker.length).replace(/^\\+|^\/+/, "")
  } catch (error) {
    return null
  }
}

function buildRequestUploadsBase() {
  return getPublicUploadBase()
}

// Some database records may contain URLs saved in a different environment
// (localhost, API host, or a migrated path). If the referenced file exists under
// the current UPLOAD_ROOT, rewrite it to the current PUBLIC_UPLOAD_BASE.
function resolveStoredAssetUrlForRequest(url, req) {
  if (!url) {
    return url
  }

  const relativePath = getRelativeUploadPath(url)
  if (!relativePath) {
    return url
  }

  const uploadRoot = getUploadRoot()
  const localPath = path.resolve(uploadRoot, relativePath)
  const relative = path.relative(uploadRoot, localPath)

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return url
  }

  if (!fs.existsSync(localPath)) {
    return url
  }

  const uploadsBase = buildRequestUploadsBase(req).replace(/\/+$/, "")
  return `${uploadsBase}/${relativePath.replace(/\\/g, "/")}`
}

// Recursively normalize asset URLs before API responses leave the backend.
// This keeps existing nested section content compatible after the Cloudinary to
// Hostinger/local-storage migration.
function normalizeStoredAssetUrlsForRequest(value, req) {
  if (typeof value === "string") {
    return resolveStoredAssetUrlForRequest(value, req)
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeStoredAssetUrlsForRequest(item, req))
  }

  if (value && Object.prototype.toString.call(value) === "[object Object]") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        normalizeStoredAssetUrlsForRequest(entryValue, req),
      ])
    )
  }

  return value
}

function getExt(filename = "") {
  return path.extname(filename).toLowerCase()
}

function getMimeType(ext) {
  const map = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
  }

  return map[ext] || "application/octet-stream"
}

function getResourceType(mimeType) {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  return "raw"
}

function safeFolder(folder) {
  return String(folder || "uploads")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/")
}

function assertInsideUploadRoot(targetPath) {
  const uploadRoot = getUploadRoot()
  const resolvedTarget = path.resolve(targetPath)
  const relative = path.relative(uploadRoot, resolvedTarget)

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid upload folder")
  }
}

async function saveUploadedFile(file, folder = "uploads") {
  const uploadRoot = getUploadRoot()
  const cleanFolder = safeFolder(folder)
  const targetDir = path.join(uploadRoot, cleanFolder)

  assertInsideUploadRoot(targetDir)
  fs.mkdirSync(targetDir, { recursive: true })

  // Save with a generated filename but retain originalName for admin display
  // and downloadable exports.
  const originalName = file.name || file.originalname || "file"
  const ext = getExt(originalName)
  const mimeType = getMimeType(ext)
  const storedFilename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`
  const targetPath = path.join(targetDir, storedFilename)

  assertInsideUploadRoot(targetPath)

  if (file.tempFilePath) {
    fs.copyFileSync(file.tempFilePath, targetPath)
  } else if (file.path) {
    fs.copyFileSync(file.path, targetPath)
  } else if (file.data) {
    fs.writeFileSync(targetPath, file.data)
  } else if (file.buffer) {
    fs.writeFileSync(targetPath, file.buffer)
  } else {
    throw new Error("Invalid uploaded file object")
  }

  fs.chmodSync(targetPath, 0o644)

  const relativePath = [cleanFolder, storedFilename].filter(Boolean).join("/").replace(/\\/g, "/")
  const url = `${getPublicUploadBase()}/${relativePath}`
  const stat = fs.statSync(targetPath)

  return {
    url,
    secureUrl: url,
    publicId: relativePath,
    filename: originalName,
    originalName,
    storedFilename,
    size: file.size || stat.size,
    bytes: file.size || stat.size,
    mimeType,
    resourceType: getResourceType(mimeType),
    path: targetPath,
  }
}

module.exports = {
  saveUploadedFile,
  getUploadRoot,
  getPublicUploadBase,
  getUploadTempDir,
  getRelativeUploadPath,
  resolveStoredAssetUrlForRequest,
  normalizeStoredAssetUrlsForRequest,
}
