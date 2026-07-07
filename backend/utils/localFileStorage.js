const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const os = require("os")

function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_ROOT || path.join(__dirname, "..", "uploads"))
}

function getPublicUploadBase() {
  return (process.env.PUBLIC_UPLOAD_BASE || "http://localhost:4000/uploads").replace(/\/+$/, "")
}

function getUploadTempDir() {
  return path.resolve(process.env.UPLOAD_TEMP_DIR || path.join(os.tmpdir(), "acero-uploads"))
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
}