# Seeding Company Updates

## How to seed

The **company-related** seeder seeds **Company Updates only** (and their categories). It no longer seeds Certifications, Customers, Brochures, or Branches.

### Prerequisites

1. **MongoDB** – `MONGODB_URI` in `.env` or `.env.local` in the backend directory.
2. **At least one user** – Create a user first (e.g. run `npm run setup:superadmin` or create via admin panel). The seeder uses this user for `createdBy`.

### Command

From the **backend** directory:

```bash
npm run seed:company-related
```

Or directly:

```bash
node seeders/companyRelatedData.seeder.js
```

This will seed, in order:

1. **Company Update Categories** (Company News, Awards, Products, Events)  
2. **Company Updates** (4 items with full schema)  
3. Update all existing Company Updates to published and featured  

---

## Brochures: backend vs seed vs admin form

### Backend model (`Brochure.js`)

| Field           | Required | Seed | Admin form |
|----------------|----------|------|------------|
| title          | ✅       | ✅   | ✅         |
| brochureImage  | No       | ✅   | ✅         |
| order          | No       | ✅   | ✅         |
| description    | No       | ✅   | ✅         |
| downloadLink   | No       | No   | ✅         |
| languages[]    | No       | No   | ✅         |
| status         | No       | Set published | Workflow |
| isActive       | No       | ✅ true | ✅     |
| publishedAt    | No       | ✅   | —          |
| featured       | No       | ✅ true | ✅     |
| createdBy      | ✅       | ✅   | —          |
| updatedBy      | No       | —    | —          |

REMOVED after seeding projects to assign each brochure a project and set `brochureImage` from that project’s image.  
\** Admin form does not expose `project`; it’s for internal/linking use.

**Conclusion:** Seed data matches the backend. The form adds optional `downloadLink` and `languages[]`; the seed doesn’t set them, which is fine. After seeding, you can add PDFs and links in the admin Brochure form.

---

## Company Updates: backend vs seed vs admin form

### Backend model (`CompanyUpdate.js`)

| Field             | Required | Seed | Admin form |
|-------------------|----------|------|------------|
| title             | ✅       | ✅   | ✅         |
| heading           | ✅       | ✅   | ✅         |
| category          | ✅ (ref) | ✅ (by name) | ✅ (dropdown) |
| slug              | ✅       | ✅   | ✅ (auto from title) |
| banner            | No       | ✅   | ✅         |
| featureImage      | No       | ✅ (as featuredImage in seed) | ✅ |
| gallery[]         | No       | ✅   | ✅         |
| linkedInPosts[]   | No       | ✅   | ✅         |
| shortDescription  | No       | ✅   | ✅         |
| description       | No       | ✅   | ✅         |
| eventDate         | No       | ✅   | ✅         |
| metaTitle         | No       | ✅   | ✅         |
| metaImage         | No       | ✅   | ✅         |
| metaDescription   | No       | ✅   | ✅         |
| metaKeywords[]    | No       | ✅   | ✅         |
| status            | No       | Set published | Workflow |
| isActive          | No       | ✅ true | ✅     |
| publishedAt       | No       | ✅   | —          |
| featured          | No       | ✅   | ✅         |
| showOnHomePage    | No       | ✅   | ✅         |
| createdBy         | ✅       | ✅   | —          |
| updatedBy         | No       | —    | —          |

**Conclusion:** Company Update seed data is aligned with the backend schema. The seeder maps `featuredImage` in the JSON to `featureImage` in the model. The admin Company Update form includes all these fields (title, slug, category, heading, banner, featureImage, gallery, linkedInPosts, shortDescription, description, eventDate, meta fields, featured, showOnHomePage, isActive).

---

## Optional: brochure images from projects

To give every brochure an image from one of its projects (and set the `project` ref):

1. Seed or create projects (e.g. `npm run seed:scraped-projects`).
2. Seed company-related data (so brochures exist): `npm run seed:company-related`.
3. Run:

   ```bash
   npm run seed:brochure-project-images
   ```

   Dry run (no DB changes):

   ```bash
   npm run seed:brochure-project-images:dry
   ```

This assigns each brochure to a project (round-robin) and sets `brochureImage` from that project’s thumbnail or first image.

---

## Summary

| What                | How |
|---------------------|-----|
| Seed Company Updates (and categories) | `npm run seed:company-related` (from backend) |
| Company Update seed vs backend/form                     | Aligned; seed matches backend; admin form covers the same (and extra optional) fields. |
