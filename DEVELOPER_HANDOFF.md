# Acero CMS Developer Handoff

This guide is a starting map for new developers. The project has three apps:

- `backend`: Express/MongoDB CMS API.
- `admin-panel`: Vite/React admin panel used to manage CMS content.
- `frontend`: Next.js public website that reads published CMS content.

## Local And Live Environments

Backend uploads are local-file based after the Cloudinary migration.

- Local upload root: `D:/Acero-Website/uploads`
- Local public upload URL: `http://localhost:4000/uploads`
- Hostinger upload root: `/var/www/cms/acero-uploads`
- Hostinger public upload URL: `https://acerogroup.co/uploads`

Important environment variables:

- Backend: `UPLOAD_ROOT`, `PUBLIC_UPLOAD_BASE`, `UPLOAD_TEMP_DIR`, `MEDIA_FOLDER_PREFIX`
- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_UPLOAD_BASE`, `NEXT_PUBLIC_SITE_URL`
- Admin panel: `VITE_API_URL`, `VITE_UPLOAD_BASE`, `VITE_SITE_URL`

Do not hardcode `localhost`, `acerogroup.co`, `api.acerogroup.co`, or legacy `acero.ae` asset paths inside components. Use the shared helpers.

## Backend Request Flow

Start at `backend/server.js`.

The API entry point:

1. Loads `.env`.
2. Connects to MongoDB.
3. Enables CORS and JSON parsing.
4. Serves `/uploads` from `UPLOAD_ROOT` for local development.
5. Adds activity logging.
6. Mounts admin routes under `/api/<resource>`.
7. Mounts public website routes under `/api/public`.

The important route groups are:

- `backend/routes/publicRoutes.js`: public website content, contact/enquiry, get quote, career applications, header/footer, customers, certifications, videos, brochures, pages, sections.
- `backend/routes/pageRoutes.js` and `backend/routes/sectionRoutes.js`: CMS page/section management from admin.
- `backend/routes/projectRoutes.js` and `backend/routes/vacancyRoutes.js`: workflow-managed content used on the public website.
- `backend/routes/workflowRoutes.js`: submit, review, approve, publish, unpublish, archive actions.
- `backend/routes/mediaRoutes.js` and `backend/routes/mediaLibraryRoutes.js`: uploads and media library.

## CMS Page And Section Flow

Pages are made of Sections. Sections have a `sectionTypeSlug` plus a `content` object.

Flow:

1. Admin loads a page and its sections.
2. Admin section editors save structured data into `section.content`.
3. Public API returns published visible sections.
4. Frontend `frontend/services/page.service.ts` fetches and normalizes the page response.
5. `frontend/components/sections/section-renderer.tsx` maps `sectionTypeSlug` to the correct React component.

When adding a new section type:

1. Add/update SectionType fields in backend seeders/models.
2. Add or update the admin editor under `admin-panel/src/components/forms/section-editors/`.
3. Save values into `section.content`.
4. Add a matching render branch in `frontend/components/sections/section-renderer.tsx`.
5. Use `frontend/utils/cms-asset-url.ts` for any CMS media values.

## Media Upload Flow

Uploads are handled by:

- `backend/utils/localFileStorage.js`
- `backend/services/uploadService.js`
- `frontend/utils/cms-asset-url.ts`
- `admin-panel/src/utils/cmsAssetUrl.js`

New uploads create a physical file and a `Media` document. The file path is stored as a `publicId`, and display URLs are stored in `url` / `secureUrl`.

Supported saved asset formats include:

- Full URL: `https://acerogroup.co/uploads/...`
- Relative URL: `/uploads/...` or `uploads/...`
- Legacy URL: `https://acero.ae/public/uploads/...`
- Bare publicId: `acero-cms/media/file.jpg` or `migrated/...`

Frontend/admin components should not build upload URLs manually. Normalize with the shared helper first.

## Workflow And Live Content

Workflow is split between live documents and staged revisions.

Key file:

- `backend/services/contentRevisionService.js`

Projects, vacancies, and sections can have staged revisions. A published item remains live while editors/reviewers work on a draft. The public website continues to show the live version until an approver publishes the revision.

The publish step applies `draftData` back onto the live MongoDB document.

Admin workflow buttons are rendered by:

- `admin-panel/src/components/workflow/WorkflowActions.jsx`

This component displays only backend-approved transitions. The backend remains the source of truth for what each role can do.

## Public Forms And Emails

Public forms currently include:

- Contact/enquiry
- Get Quote popup
- Career application
- CV upload

Public submit endpoints are in `backend/routes/publicRoutes.js`.

Email and notification logic is in:

- `backend/services/notificationService.js`
- `backend/models/SMTPSettings.js`
- `backend/models/FormConfiguration.js`

Admin users configure SMTP and default notification recipients from the admin panel. Email dates use `EMAIL_TIMEZONE`, defaulting to `Asia/Dubai`.

Public form rate limits are in:

- `backend/middleware/publicRateLimit.js`

These are in-memory limits suitable for local and single-instance Hostinger hosting. If the backend is ever scaled to multiple instances, replace the in-memory `Map` with Redis or another shared store.

## Admin Panel Flow

Start at:

- `admin-panel/src/App.jsx`
- `admin-panel/src/services/api.js`
- `admin-panel/src/contexts/AuthContext.jsx`
- `admin-panel/src/contexts/PermissionContext.jsx`

The admin panel uses:

- `VITE_API_URL` for API calls.
- `ProtectedRoute` for route-level permission checks.
- `PermissionContext` for client-side permission lookups.
- Backend role/permission APIs as the source of truth.

Admin image previews should use:

- `admin-panel/src/utils/cmsAssetUrl.js`

## Frontend Public Website Flow

Important files:

- `frontend/lib/api/client.ts`: shared fetch client.
- `frontend/services/page.service.ts`: fetches CMS pages/sections.
- `frontend/components/sections/section-renderer.tsx`: section dispatcher.
- `frontend/utils/cms-asset-url.ts`: CMS media URL normalization.
- `frontend/components/ui/cms-image.tsx`: direct image rendering for CMS uploads.

For CMS images, prefer normal `img`/`CmsImage` with normalized URLs. Use `next/image` only for static source-code assets where dimensions and optimization behavior are controlled.

## SEO And Sharing

Public pages should read meta title, meta description, and share image from CMS page data when available. If social previews are stale, remember that WhatsApp, LinkedIn, Facebook, and search engines cache previews outside the website.

## Deployment Checklist

Before pushing live:

1. Confirm backend `.env` has correct `UPLOAD_ROOT` and `PUBLIC_UPLOAD_BASE`.
2. Confirm frontend `.env.production` has correct `NEXT_PUBLIC_*` values.
3. Confirm admin panel `.env.production` has correct `VITE_*` values.
4. Build frontend/admin locally if possible.
5. Pull on Hostinger.
6. Restart backend and frontend processes.
7. Test one CMS image upload, one public form, one workflow action, and one public page render.

## Common Debug Paths

Image not showing:

1. Check DB saved value.
2. Check physical file under `UPLOAD_ROOT`.
3. Check public URL under `PUBLIC_UPLOAD_BASE`.
4. Check frontend/admin URL helper output.
5. Check browser Network response.

Section not changing on frontend:

1. Confirm section is published/visible.
2. Confirm page path/slug matches the public page.
3. Check public API response from `/api/public/...`.
4. Check `SectionRenderer` has a branch for the section type.

Workflow button missing:

1. Check user role and permissions.
2. Check resource status.
3. Check `/api/workflow/:resource/:id/actions`.
4. Check `WorkflowActions.jsx` transition mapping.

Email not sending:

1. Send test email from SMTP settings.
2. Confirm sender mailbox is valid and not over quota.
3. Confirm SMTP secure/port pairing.
4. Check `notificationService.js` logs.
5. Check `FormConfiguration` recipient values.
