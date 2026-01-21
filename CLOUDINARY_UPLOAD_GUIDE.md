# Cloudinary Upload Guide

This guide explains exactly how to upload files to Cloudinary through the Acero CMS system.

## Prerequisites

### 1. Cloudinary Account Setup

1. **Create a Cloudinary Account** (if you don't have one)
   - Go to https://cloudinary.com/
   - Sign up for a free account

2. **Get Your Cloudinary Credentials**
   - Log into your Cloudinary Dashboard
   - Go to **Settings** → **Security** or **Dashboard**
   - Copy these three values:
     - **Cloud Name** (e.g., `your-cloud-name`)
     - **API Key** (e.g., `123456789012345`)
     - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### 2. Environment Variables Configuration

Add these to your `.env` file in the `backend` folder:

```env
# Cloudinary Configuration
CLOUD_NAME=your-cloud-name
API_KEY=your-api-key
API_SECRET=your-api-secret

# Optional: Customize folder prefix (default: 'acero-cms')
MEDIA_FOLDER_PREFIX=acero-cms

# Optional: File size limits (in bytes)
MAX_FILE_SIZE=10485760          # 10MB default for images
MAX_VIDEO_SIZE=104857600        # 100MB default for videos

# Optional: Allowed file types
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp,svg
ALLOWED_VIDEO_TYPES=mp4,webm,mov
```

## Upload Methods

### Method 1: Upload Through Media Picker (Recommended)

This is the easiest way and is built into the admin panel:

1. **Open any form that uses images** (e.g., Project Form, Company Update Form)
2. **Click "Select from Library"** button next to any image field
3. **Go to "Upload New" tab** in the Media Picker modal
4. **Set the folder** (or leave default):
   - For projects: `projects/thumbnails` or `projects/meta`
   - For company updates: `company-updates/banners`, `company-updates/features`, etc.
   - For other content: Use the folder suggested by the form
5. **Click or drag files** to upload
6. **Files are automatically:**
   - Uploaded to Cloudinary
   - Saved to the database
   - Available for selection immediately

### Method 2: Upload Through ImageUpload/GalleryUpload Components

1. **In any form**, click **"Upload Image"** or **"Upload Images"** button
2. **Select your file(s)** from your computer
3. **File is automatically uploaded** to the correct folder based on the form field

### Method 3: Direct API Upload

Use the API endpoint directly:

**Endpoint:** `POST /api/media/upload`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
- `file` or `files`: The file(s) to upload
- `folder` (optional): Folder path (e.g., `projects/thumbnails`)
- `tags` (optional): Comma-separated tags (e.g., `project,thumbnail,hero`)
- `description` (optional): Description of the file
- `altText` (optional): Alt text for accessibility

**Example using cURL:**
```bash
curl -X POST http://localhost:4000/api/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/image.jpg" \
  -F "folder=projects/thumbnails" \
  -F "tags=project,thumbnail" \
  -F "description=Project thumbnail image" \
  -F "altText=Project thumbnail"
```

**Example using JavaScript (fetch):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'projects/thumbnails');
formData.append('tags', 'project,thumbnail');
formData.append('description', 'Project thumbnail image');
formData.append('altText', 'Project thumbnail');

const response = await fetch('http://localhost:4000/api/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

## Folder Structure

Files are organized in Cloudinary with this structure:

```
acero-cms/
├── projects/
│   ├── thumbnails/
│   └── meta/
├── company-updates/
│   ├── banners/
│   ├── features/
│   ├── gallery/
│   └── meta/
├── industries/
│   └── logos/
├── brochures/
├── certifications/
├── customers/
├── branches/
│   └── logos/
└── media/ (default folder)
```

**Full Cloudinary Path Example:**
- Folder specified: `projects/thumbnails`
- Actual Cloudinary path: `acero-cms/projects/thumbnails/image-name.jpg`

## File Requirements

### Images
- **Allowed Types:** JPG, JPEG, PNG, GIF, WEBP, SVG
- **Max Size:** 10MB (configurable via `MAX_FILE_SIZE`)
- **Auto-optimization:** Enabled (quality: auto, format: auto)

### Videos
- **Allowed Types:** MP4, WEBM, MOV
- **Max Size:** 100MB (configurable via `MAX_VIDEO_SIZE`)

### Other Files
- **Allowed Types:** PDF, DOC, DOCX, XLS, XLSX, TXT
- **Max Size:** 20MB

## What Happens When You Upload

1. **File Validation**
   - Checks file type
   - Checks file size
   - Validates format

2. **Cloudinary Upload**
   - File is uploaded to: `{MEDIA_FOLDER_PREFIX}/{folder}/{filename}`
   - Automatic optimization applied (for images)
   - Returns Cloudinary URL and metadata

3. **Database Record**
   - Creates a Media record in MongoDB with:
     - Cloudinary public ID
     - URLs (http and https)
     - File metadata (size, dimensions, format)
     - Folder path
     - Uploader information
     - Tags, description, alt text

4. **Immediate Availability**
   - File appears in Media Picker immediately
   - Can be selected and used in forms right away

## Folder Mapping by Form

When uploading through forms, files automatically go to these folders:

| Form/Component | Field | Folder Path |
|---------------|-------|-------------|
| ProjectForm | Thumbnail Image | `projects/thumbnails` |
| ProjectForm | Meta Image | `projects/meta` |
| CompanyUpdateForm | Banner Image | `company-updates/banners` |
| CompanyUpdateForm | Feature Image | `company-updates/features` |
| CompanyUpdateForm | Gallery Images | `company-updates/gallery` |
| CompanyUpdateForm | Meta Image | `company-updates/meta` |
| IndustryForm | Logo | `industries/logos` |
| BrochureForm | File | `brochures` |
| CertificationForm | Image | `certifications` |
| CustomerForm | Logo | `customers` |
| BranchForm | Logo | `branches/logos` |

## Best Practices

1. **Use Descriptive Filenames**
   - Good: `project-warehouse-dubai-thumbnail.jpg`
   - Bad: `IMG_1234.jpg`

2. **Add Alt Text**
   - Improves accessibility
   - Better SEO
   - Required for some forms

3. **Use Appropriate Folders**
   - Keeps media organized
   - Makes searching easier
   - Filters work better in Media Picker

4. **Optimize Before Upload**
   - Compress large images
   - Use appropriate formats (WebP for photos, PNG for graphics)
   - System auto-optimizes, but smaller files = faster uploads

5. **Add Tags**
   - Makes searching easier
   - Helps organize related media
   - Example: `project,warehouse,dubai,hero`

## Troubleshooting

### Upload Fails
- Check file size (must be under limit)
- Check file type (must be in allowed list)
- Verify Cloudinary credentials in `.env`
- Check user permissions (must be editor+ role)

### Files Not Appearing in Media Picker
- Refresh the page
- Check if folder filter is correct
- Verify file was uploaded successfully (check database)
- Check user role (non-admins only see their own uploads)

### Wrong Folder
- Files are organized by the `folder` parameter
- Check the form's folder prop
- Can manually specify folder in Media Picker upload tab

## API Response Format

Successful upload returns:

```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "media": {
      "_id": "media-id",
      "filename": "image.jpg",
      "originalName": "image.jpg",
      "publicId": "acero-cms/projects/thumbnails/image",
      "url": "http://res.cloudinary.com/...",
      "secureUrl": "https://res.cloudinary.com/...",
      "resourceType": "image",
      "format": "jpg",
      "size": 123456,
      "width": 1920,
      "height": 1080,
      "folder": "projects/thumbnails",
      "uploadedBy": "user-id",
      "tags": ["project", "thumbnail"],
      "description": "",
      "altText": "",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Quick Start Checklist

- [ ] Create Cloudinary account
- [ ] Get Cloudinary credentials (Cloud Name, API Key, API Secret)
- [ ] Add credentials to `backend/.env` file
- [ ] Restart backend server
- [ ] Test upload through Media Picker
- [ ] Verify file appears in Cloudinary dashboard
- [ ] Verify file appears in Media Picker library

That's it! Your files are now being uploaded to Cloudinary and managed through the system.

