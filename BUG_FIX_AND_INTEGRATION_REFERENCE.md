# Bug Fix & Integration Reference

**Purpose:** Master reference for systematic bug fixing and left-out integrations. Use this document every time you work on parent/child pages and their functionality across Admin Panel, Backend, and Frontend.

**How to use:**  
1. Before touching a page/feature, find its parent/child and API in this doc.  
2. Cross-check with `frontendDesign.md`, `DESIGN.md`, and `WORKFLOW_INTEGRATION_GUIDE.md`.  
3. Tick items in **§6 One-by-One Checklist** as you verify or fix them.  
4. Update **§7 Known Gaps** when you find or fix integration issues.

**Last Updated:** 2025-01-27

---

## 1. Reference Documents (Keep Handy)

| Document | Path | Use |
|----------|------|-----|
| Frontend Design | `frontend/frontendDesign.md` | Design system, sections, API expectations, layout |
| Admin Panel Design | `admin-panel/DESIGN.md` | Admin UI patterns, colors, components |
| Workflow & Integration | `WORKFLOW_INTEGRATION_GUIDE.md` | Approval workflow, resource naming, permissions |

---

## 2. Admin Panel: Parent & Child Pages

Admin menu is **dynamic** from Resources (`menuResources` in `PermissionContext`). Parent/child is determined by `parentId` on resources. Hardcoded parent routes that redirect to first child: `ParentRouteRedirect.jsx`.

### 2.1 Top-Level (No Parent)

| Route | Page | Resource (action) | Functionality |
|-------|------|-------------------|---------------|
| `/` | Login | — | Login |
| `/dashboard` | Dashboard | — | Dashboard, pending items links |
| `/users` | Users | users (read) | User list |
| `/permissions` | Permissions | permissions (read) | Permissions overview |
| `/permissions/role/:roleName` | RolePermissions | permissions (update) | Role-permission matrix |
| `/profile` | Profile | — | User profile |
| `/pages` | Pages | pages (read) | Page list |
| `/pages/new` | PageEditor | pages (create) | New page |
| `/pages/tree` | PageTree | pages (read) | Page tree |
| `/pages/:id` | PageEditor | pages (update) | Edit page |
| `/projects` | Projects | projects (read) | Project list |
| `/projects/new` | ProjectEditor | projects (create) | New project |
| `/projects/:id` | ProjectEditor | projects (update) | Edit project |
| `/workflow` | Workflow | workflow (read) | Workflow hub |
| `/resources` | Resources | — | Resource list |
| `/roles` | Roles | — | Role list |
| `/versions/:resource/:id` | VersionHistory | pages (read) | Version history |
| `/versions/:resource/:id/compare` | VersionCompare | pages (read) | Version compare |

### 2.2 Pages → Sections (Parent → Child)

| Parent Route | Child Routes | Child Page | Resource |
|--------------|--------------|------------|----------|
| `/pages` | `/pages/:pageId/sections` | Sections | sections (read) |
| | `/pages/:pageId/sections/new` | SectionEditor | sections (create) |
| | `/pages/:pageId/sections/:sectionId` | SectionEditor | sections (update) |

### 2.3 Parent Routes (Redirect to First Child)

| Parent Route | Redirect Target | Children (from App.jsx) |
|--------------|-----------------|---------------------------|
| `/enquiries-applications` | First child by resource order | Vacancies, Enquiries, Applications, Form Configuration |
| `/website-configurations` | First child by resource order | Header, Footer, Appearance, SMTP, ReCaptcha, Maps |
| `/company-related-information` | First child by resource order | (Defined in Resources DB) |

### 2.4 Website Configurations (Children under `/website-configurations`)

| Route | Page | Resource |
|-------|------|----------|
| `/website-configurations/header` | HeaderConfigurations | header-configurations |
| `/website-configurations/header/new` | HeaderConfigurationEditor | header-configurations (create) |
| `/website-configurations/header/:id` | HeaderConfigurationEditor | header-configurations (update) |
| `/website-configurations/footer` | FooterConfigurations | footer-configurations |
| `/website-configurations/footer/new` | FooterConfigurationEditor | footer-configurations (create/update) |
| `/website-configurations/appearance` | WebsiteAppearances | website-appearance |
| `/website-configurations/appearance/new` | WebsiteAppearanceEditor | website-appearance (create/update) |
| `/website-configurations/smtp` | SMTPSettings | smtp-settings |
| `/website-configurations/smtp/new` | SMTPSettingsEditor | smtp-settings (create/update) |
| `/website-configurations/recaptcha` | GoogleReCaptchas | google-recaptcha |
| `/website-configurations/recaptcha/new` | GoogleReCaptchaEditor | google-recaptcha (create/update) |
| `/website-configurations/maps` | GoogleMaps | google-maps |
| `/website-configurations/maps/new` | GoogleMapsEditor | google-maps (create/update) |

### 2.5 Enquiries & Applications (Children under `/enquiries-applications`)

| Route | Page | Resource |
|-------|------|----------|
| `/enquiries-applications/vacancies` | Vacancies | vacancies |
| `/enquiries-applications/vacancies/new` | VacancyEditor | vacancies (create) |
| `/enquiries-applications/vacancies/:id` | VacancyEditor | vacancies (update) |
| `/enquiries-applications/enquiries` | Enquiries | enquiries |
| `/enquiries-applications/enquiries/:id` | EnquiryEditor | enquiries (update) |
| `/enquiries-applications/applications` | Applications | applications |
| `/enquiries-applications/applications/:id` | ApplicationEditor | applications (update) |
| `/enquiries-applications/form-configuration` | FormConfigurationEditor | form-configurations (update) |

### 2.6 Company-Related & Standalone CRUD

| Route | Page | Resource |
|-------|------|----------|
| `/branches` | Branches | branches |
| `/branches/new` | BranchEditor | branches (create) |
| `/branches/:id` | BranchEditor | branches (update) |
| `/customers` | Customers | customers |
| `/certifications` | Certifications | certifications |
| `/company-updates` | CompanyUpdates | company-updates |
| `/company-update-categories` | CompanyUpdateCategories | company-update-categories |
| `/brochures` | Brochures | brochures |
| `/media-library` | MediaLibrary | media-library |
| `/building-types` | BuildingTypes | building-types |
| `/industries` | Industries | industries |
| `/countries` | Countries | countries |
| `/regions` | Regions | regions |
| `/areas` | Areas | areas |
| `/section-types` | SectionTypes | — |
| `/dashboard/pending` | PendingItems | pages (read) |
| `/dashboard/my-drafts` | MyDrafts | pages (read) |
| `/dashboard/my-submissions` | MySubmissions | pages (read) |

---

## 3. Frontend: Parent & Child Pages

Frontend uses **Next.js App Router**. Page content is driven by **slug** via `usePage(slug)` → `getPageBySlug(slug)` → `GET /api/public/pages/slug/:slug`. CMS must have a published page with matching `slug` for each route below (where CMS-driven).

### 3.1 Route → Slug Mapping (CMS-Driven)

| Frontend Route | usePage(slug) | Backend API |
|----------------|---------------|-------------|
| `/` (root) | `'home'` | GET /api/public/pages/slug/home |
| `/home` | (if used) | same slug `home` |
| `/who-we-are` | `'who-we-are'` | slug who-we-are |
| `/manufacturing` | `'manufacturing'` | slug manufacturing |
| `/products` | `'products'` | slug products |
| `/products/peb` | `'peb'` | slug peb |
| `/products/peb-comparison` | `'peb-comparison'` | slug peb-comparison |
| `/products/conventional-steel` | `'conventional-steel'` | slug conventional-steel |
| `/products/porta-cabins` | `'porta-cabins'` | slug porta-cabins |
| `/products/racking-systems` | `'racking-systems'` | slug racking-systems |
| `/products/accessories` | `'accessories'` | slug accessories |
| `/projects` | `'projects'` | slug projects |
| `/media` | `'literature'` (then redirect to /media/literature) | slug literature |
| `/media/literature` | `'literature'` | slug literature |
| `/media/video` | `'video'` | slug video |
| `/media/company-update` | `'company-update'` | slug company-update |
| `/media/company-update/[slug]` | **Static `companyUpdatesData`** ⚠️ | **Should use GET /api/public/company-updates/slug/:slug** |
| `/career` | `'career'` | slug career |
| `/contact-us` | `'contact-us'` | slug contact-us |
| `/thank-you` | (confirm usage) | — |

### 3.2 Dynamic / Hybrid Pages

| Route | Data Source | Notes |
|-------|-------------|--------|
| `/projects` | CMS sections + `useIndustries()` → /api/public/industries, filter-options, projects | Projects grid + filters |
| `/projects/[industry]` | CMS + industries/building-types/projects by industry | Industry landing |
| `/projects/[industry]/[buildingType]` | CMS + projects filtered by industry + buildingType | Project list/detail |
| `/media/company-update` | CMS sections + `useCompanyUpdates()` → /api/public/company-updates | List from API |
| `/media/company-update/[slug]` | **Static `companyUpdatesData`** ⚠️ | **Must integrate with GET /api/public/company-updates/slug/:slug** |
| `/contact-us` | CMS + (form → POST /api/public/enquiries) | Enquiry form |
| `/career` | CMS + vacancies, applications (POST /api/public/applications, upload-cv) | Career form + CV |

### 3.3 Section Types → Components

Section rendering is in `frontend/components/sections/section-renderer.tsx`. Backend `sectionTypeSlug` maps to components, e.g.:

- `hero_carousel` → HeroCarousel  
- `content_with_image` → ContentSection  
- `statistics` → StatsDisplay  
- `infinite_carousel` → InfiniteCarousel / DynamicInfiniteCarousel (certs, customers)  
- `projects_grid_with_filters` → handled inside Projects page with ProjectFilters + ProjectsGridSection  
- `company_updates_*` → CompanyUpdatesSection / DynamicCompanyUpdatesSection  
- `video_cards` → VideoCardsSection  
- `hero_image` → HeroImageSection  
- (others) → see section-renderer.tsx switch

---

## 4. Backend: Public API Used by Frontend

| Method | Endpoint | Used By (Frontend) |
|--------|----------|--------------------|
| GET | /api/public/pages/tree | (Navigation / sitemap if implemented) |
| GET | /api/public/pages/slug/:slug | usePage(slug) → page.service getPageBySlug |
| GET | /api/public/pages/by-path?path= | getPageByPath (alternative to slug) |
| GET | /api/public/header-configuration | header.service, useHeader |
| GET | /api/public/footer-configuration | footer.service, useFooter |
| GET | /api/public/website-appearance | appearance.service, useAppearance |
| GET | /api/public/industries | projects filters, useIndustries |
| GET | /api/public/building-types | projects filters, useBuildingTypes |
| GET | /api/public/projects | projects, useProjects, useFeaturedProjects |
| GET | /api/public/filter-options | cascading filters |
| GET | /api/public/projects/slug/:slug | project detail by slug |
| GET | /api/public/branches | useBranches, branch.service |
| GET | /api/public/certifications | useCertificates, dynamic infinite carousel |
| GET | /api/public/customers | useCustomers, dynamic infinite carousel |
| GET | /api/public/company-updates | useCompanyUpdates |
| GET | /api/public/company-updates/slug/:slug | **Not used yet** — company-update detail page uses static data |
| GET | /api/public/brochures | useBrochures |
| GET | /api/public/videos | useVideos, media.service (VideoCardsSection) |
| GET | /api/public/vacancies | useVacancies, career |
| GET | /api/public/form-configuration | (contact/career forms if needed) |
| POST | /api/public/enquiries | contact form |
| POST | /api/public/applications | career application |
| POST | /api/public/upload-cv | CV upload for applications |

---

## 5. Workflow Resources (Backend)

Workflow applies to resources in `backend/routes/workflowRoutes.js`:

`page`, `section`, `project`, `branch`, `customer`, `certification`, `company-update`, `company-update-category`, `brochure`, `building-type`, `industry`, `country`, `region`, `area`, `header-configuration`, `footer-configuration`, `website-appearance`, `smtp-settings`, `google-recaptcha`, `google-maps`, `vacancy`.

**Resource naming:** Route/param uses **singular** (e.g. `project`). Resource document slug and permission checks use **plural** where applicable (e.g. `projects`). See WORKFLOW_INTEGRATION_GUIDE.md.

---

## 6. One-by-One Checklist (Parent/Child + Functionality)

Use this section to track what has been **checked**, **tested**, and **fixed**. Go one parent (or one area) at a time.

### 6.1 Admin Panel

- [ ] **Dashboard** – loads, pending/my-drafts/my-submissions links work  
- [ ] **Pages** – list, new, edit, tree; permissions and workflow  
- [ ] **Pages → Sections** – list/create/edit under a page; workflow guard  
- [ ] **Projects** – list, new, edit; workflow  
- [ ] **Website Configurations** – Header, Footer, Appearance, SMTP, ReCaptcha, Maps (list/new/edit)  
- [ ] **Enquiries & Applications** – Vacancies, Enquiries, Applications, Form Configuration  
- [ ] **Company-related** – Branches, Customers, Certifications, Company Updates, Company Update Categories, Brochures  
- [ ] **Media Library** – list, new, edit (incl. YouTube for videos)  
- [ ] **Reference data** – Building Types, Industries, Countries, Regions, Areas  
- [ ] **Section Types** – list/new/edit  
- [ ] **Users, Permissions, RolePermissions, Resources, Roles**  
- [ ] **Workflow** – hub and status transitions for each resource type  
- [ ] **Versions** – VersionHistory, VersionCompare  
- [ ] **ParentRouteRedirect** – /enquiries-applications, /website-configurations, /company-related-information → first child

### 6.2 Frontend

- [ ] **Home** (`/`) – usePage('home'), sections render, header/footer/appearance from API  
- [ ] **Who We Are** – usePage('who-we-are')  
- [ ] **Manufacturing** – usePage('manufacturing')  
- [ ] **Products** – parent + children (products, peb, peb-comparison, conventional-steel, porta-cabins, racking-systems, accessories); slug matches CMS  
- [ ] **Projects** – page + industries/buildings/projects from API; filters and deep links  
- [ ] **Projects [industry]** – industry content + building types + projects  
- [ ] **Projects [industry] [buildingType]** – project list/detail  
- [ ] **Media** – redirect to /media/literature  
- [ ] **Media > Literature** – usePage('literature')  
- [ ] **Media > Video** – usePage('video') + videos from /api/public/videos  
- [ ] **Media > Company Update** – list from /api/public/company-updates  
- [ ] **Media > Company Update [slug]** – **Integrate with /api/public/company-updates/slug/:slug** (replace static `companyUpdatesData`)  
- [ ] **Career** – usePage('career'), vacancies, application form, CV upload  
- [ ] **Contact Us** – usePage('contact-us'), enquiry form → POST /api/public/enquiries  
- [ ] **Thank You** – behaviour and redirects  

### 6.3 Backend

- [ ] **Public routes** – all GET/POST above return correct shape and status  
- [ ] **Auth + RBAC** – protected admin routes and workflow actions  
- [ ] **Workflow** – state machine and permissions per resource  
- [ ] **Media/Videos** – YouTube fields and public videos endpoint  
- [ ] **Enquiries/Applications** – validation, FormConfiguration, notifications if any  

---

## 7. Known Gaps & Left-Out Integrations

1. **Company Update detail (frontend)**  
   - **File:** `frontend/app/media/company-update/[slug]/page.tsx`  
   - **Issue:** Uses static `companyUpdatesData` instead of API.  
   - **Fix:** Use `GET /api/public/company-updates/slug/:slug` (e.g. via `useCompanyUpdate(slug)` or equivalent) and render `CompanyUpdateDetail` from that response.

2. **Frontend API base URL**  
   - **Env:** `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000`).  
   - **Check:** Same in dev/staging/prod and CORS allowed from frontend origin.

3. **Contact form / Enquiry**  
   - **Verify:** Frontend sends payload matching backend validation (purpose, fullName, email, mobileNumber, country, subject, message).  
   - **Verify:** Form configuration (e.g. ReCaptcha) is used if required.

4. **Career application / CV**  
   - **Verify:** CV upload uses POST /api/public/upload-cv; then application payload includes `vacancyId` and `cvFile { url, publicId, filename }`.  
   - **Verify:** File type/size validation and error handling on frontend.

5. **Page-by-path vs slug**  
   - Frontend uses **slug** in practice (usePage(slug)).  
   - If any route is driven by **path**, use `getPageByPath(path)` and `GET /api/public/pages/by-path?path=...`. Ensure CMS `path` matches.

6. **Section type coverage**  
   - Every section type used in admin must have a corresponding case in `section-renderer.tsx`.  
   - If new section types are added in backend, add mapping and component in frontend.

---

## 8. Quick Reference: Where Things Live

| Concern | Location |
|--------|----------|
| Admin routes | `admin-panel/src/App.jsx` |
| Admin menu (parent/child) | `Sidebar.jsx` + Resources (menuResources) |
| Parent redirect | `ParentRouteRedirect.jsx` |
| Frontend routes | `frontend/app/**/page.tsx` |
| Frontend page data (slug) | `use-page.ts` → `page.service.ts` → `/api/public/pages/slug/:slug` |
| Section rendering | `frontend/components/sections/section-renderer.tsx` |
| Public API | `backend/routes/publicRoutes.js` |
| Workflow routes | `backend/routes/workflowRoutes.js` |
| Workflow logic | `backend/controllers/workflowController.js`, `utils/workflowValidator.js`, `utils/workflowStatusValidator.js` |

---

Use this document as the single reference when doing bug fixing and integration work. Update the checklists and “Known Gaps” as you complete or discover items.
