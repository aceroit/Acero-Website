# Backend to Frontend Data Mapping - Implementation Guide

## ⚠️ CRITICAL REQUIREMENT - READ FIRST

**ALL PUBLIC API ROUTES MUST ONLY RETURN PUBLISHED DATA**

- All endpoints under `/api/public/*` filter by `status: 'published'`
- Draft content is NEVER accessible through public routes
- Frontend should ONLY use `/api/public/*` endpoints
- Content seeded with `status: 'draft'` will NOT appear on frontend until published
- This is a security and content management requirement - non-negotiable

See [Critical Security Requirement](#-critical-security-requirement-published-data-only) section for details.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Goals and Objectives](#goals-and-objectives)
3. [Architecture Overview](#architecture-overview)
4. [Folder Structure](#folder-structure)
5. [Data Mapping Strategy](#data-mapping-strategy)
6. [Implementation Phases](#implementation-phases)
7. [File Naming Conventions](#file-naming-conventions)
8. [Seeder Pattern](#seeder-pattern)
9. [Frontend Refactoring Pattern](#frontend-refactoring-pattern)
10. [Testing Strategy](#testing-strategy)
11. [Important Notes and Constraints](#important-notes-and-constraints)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

This project involves mapping all static frontend content to a dynamic backend database structure. The frontend is built with Next.js (TypeScript) and currently uses hardcoded data. The backend is a Node.js/Express API with MongoDB, featuring a CMS system with Pages, Sections, and SectionTypes.

**Key Principle**: The design must remain 100% intact. Only the data source changes from static to dynamic.

**⚠️ CRITICAL SECURITY REQUIREMENT**: All public API routes (`/api/public/*`) MUST ONLY return data with `status: 'published'`. Draft content is NEVER exposed to the frontend. This ensures proper content management and workflow control.

---

## Goals and Objectives

### Primary Goals
1. **Map all frontend static data to backend database**
2. **Create seed scripts for each page** - All content initially in `draft` status for workflow testing
3. **Refactor frontend to be fully dynamic** - Fetch data from API instead of hardcoded values
4. **Preserve all design elements** - No visual changes, animations, or styling modifications

### Success Criteria
- ✅ All pages fetch content from backend API
- ✅ All sections are dynamically rendered
- ✅ Header, Footer, and Appearance are configurable via CMS
- ✅ Design remains identical to current static version
- ✅ Workflow system can be tested (draft → published)

---

## Architecture Overview

### Backend Structure
```
Pages (Page Model)
  └── Sections (Section Model)
       └── SectionTypes (SectionType Model) - Defines schema
```

### Data Flow
1. **Website Configuration** (Header, Footer, Appearance) → Global settings
2. **Pages** → Each frontend route becomes a Page document
3. **Sections** → Each component on a page becomes a Section document
4. **SectionTypes** → Define the schema/structure for each section type

### ⚠️ CRITICAL: Published Data Only
**ALL public API routes (`/api/public/*`) MUST ONLY return data with `status: 'published'`**

- Pages: Only published pages are returned
- Sections: Only published sections are returned
- Header/Footer/Appearance: Only published and featured configurations are returned
- Projects, Vacancies, Company Updates, etc.: Only published and featured items are returned
- Draft content is NEVER exposed through public routes

This is enforced in:
- `backend/routes/publicRoutes.js` - All endpoints filter by `status: 'published'`
- Model static methods like `getPublished()`, `getPublishedSections()`, `getPublishedTree()`

### Frontend Structure
```
Page Component (app/**/page.tsx)
  └── Header (dynamic from API)
  └── Main Content
       └── SectionRenderer (dynamically renders sections)
  └── Footer (dynamic from API)
```

---

## Folder Structure

### Backend Seeders Structure
```
backend/
├── seeders/
│   ├── headerConfiguration.seeder.js          # Phase 1
│   ├── footerConfiguration.seeder.js        # Phase 1
│   ├── websiteAppearance.seeder.js          # Phase 1
│   ├── sectionTypesExtended.seeder.js       # Phase 4
│   ├── pages/
│   │   ├── homepage.seeder.js               # Phase 3
│   │   ├── whoWeAre.seeder.js               # Phase 3
│   │   ├── products.seeder.js               # Phase 3
│   │   ├── productsPeb.seeder.js           # Phase 3
│   │   ├── productsConventionalSteel.seeder.js
│   │   ├── productsRackingSystems.seeder.js
│   │   ├── productsPortaCabins.seeder.js
│   │   ├── productsAccessories.seeder.js
│   │   ├── productsPebComparison.seeder.js
│   │   ├── productsManufacturing.seeder.js
│   │   ├── projects.seeder.js
│   │   ├── mediaLiterature.seeder.js
│   │   ├── mediaVideo.seeder.js
│   │   ├── mediaCompanyUpdate.seeder.js
│   │   ├── career.seeder.js
│   │   ├── contactUs.seeder.js
│   │   └── thankYou.seeder.js
│   └── projectsFromDataJson.seeder.js       # Phase 6
```

### Frontend Structure
```
frontend/
├── lib/
│   └── api.ts                               # API service layer (Phase 2)
├── components/
│   ├── header.tsx                           # Refactor (Phase 2)
│   ├── footer.tsx                           # Refactor (Phase 2)
│   └── sections/
│       └── section-renderer.tsx             # New (Phase 5)
└── app/
    └── **/page.tsx                          # Refactor all pages (Phase 5)
```

---

## Data Mapping Strategy

### 1. Website Configuration Mapping

#### Header Configuration
**Source**: `frontend/components/header.tsx`
**Target**: `backend/models/HeaderConfiguration.js`

**Mapping**:
- Logo: Image URL and alt text
- Brand name: "ACERO"
- Navigation links: Map from `navLinks` array (lines 8-35)
  - Include dropdown menus for Products and Media
- Theme toggle: `enabled: true`
- CTA button: "Get Quote" → `/contact-us`

#### Footer Configuration
**Source**: `frontend/components/footer.tsx`
**Target**: `backend/models/FooterConfiguration.js`

**Mapping**:
- Brand info: Logo, description
- Contact info: Phone (+97148931000), email, address
- Social links: LinkedIn, Twitter, Instagram, YouTube
- Quick links, Products links, Media links
- Copyright text and year
- Legal links

#### Website Appearance
**Source**: `frontend/app/globals.css` and `frontendDesign.md`
**Target**: `backend/models/WebsiteAppearance.js`

**Mapping**:
- Color palette (light mode, dark mode, steel colors)
- Typography (font families, font scale)
- Spacing (container, section padding, grid gaps)
- Border radius

### 2. Page Mapping

Each frontend page route maps to a Page document:

| Frontend Route | Page Slug | Page Path | Seeder File |
|---------------|-----------|-----------|-------------|
| `/` | `home` | `/` | `homepage.seeder.js` |
| `/who-we-are` | `who-we-are` | `/who-we-are` | `whoWeAre.seeder.js` |
| `/products` | `products` | `/products` | `products.seeder.js` |
| `/products/peb` | `peb` | `/products/peb` | `productsPeb.seeder.js` |
| `/projects` | `projects` | `/projects` | `projects.seeder.js` |
| `/media/literature` | `literature` | `/media/literature` | `mediaLiterature.seeder.js` |
| `/career` | `career` | `/career` | `career.seeder.js` |
| `/contact-us` | `contact-us` | `/contact-us` | `contactUs.seeder.js` |
| `/thank-you` | `thank-you` | `/thank-you` | `thankYou.seeder.js` |

### 3. Section Mapping

Each component/section on a page maps to a Section document with:
- `pageId`: Reference to the Page
- `sectionTypeSlug`: Type of section (e.g., `hero_carousel`, `content_with_image`)
- `order`: Display order on the page
- `content`: Dynamic content based on SectionType schema
- `status`: Always `draft` initially

### 4. SectionType Mapping

Each frontend component needs a corresponding SectionType that defines:
- `name`: Human-readable name
- `slug`: Unique identifier (e.g., `hero_carousel`)
- `category`: Grouping (Headers, Content, Media, Forms, etc.)
- `fields`: Schema definition for the `content` field

**Existing SectionTypes** (from `sectionTypes.seeder.js`):
- `hero` - Hero section
- `text_block` - Text content
- `image_gallery` - Image gallery
- `features_grid` - Features grid
- `video` - Video section
- `timeline` - Timeline
- `cta` - Call to action
- `statistics` - Statistics display

**New SectionTypes Needed** (to be created in `sectionTypesExtended.seeder.js`):
- `hero_carousel` - Hero carousel with slides
- `hero_image` - Simple hero with image and title
- `content_with_image` - Content section with optional image and CTA
- `infinite_carousel` - Infinite scrolling carousel
- `projects_grid` - Projects grid display
- `company_updates` - Company updates section
- `product_card` - Product card with image, content, CTA
- `image_modal_gallery` - Image gallery with modal
- `image_display` - Single image display
- `application_cards` - Application icons grid
- `circular_advantages` - Circular advantages display
- `premium_video` - Premium video section
- `brochure_cards` - Brochure cards grid
- `video_cards` - Video cards grid
- `company_updates_list` - Company updates list
- `linkedin_posts` - LinkedIn posts section
- `career_application_form` - Career form
- `head_office_section` - Head office info
- `branch_selector` - Branch selector with accordion
- `contact_form` - Contact form
- `full_width_map` - Full width Google Maps
- `thank_you_content` - Thank you page content
- `projects_grid_with_filters` - Projects with filters

---

## Implementation Phases

### Phase 1: Website Configuration Seeders
**Goal**: Create seeders for Header, Footer, and Appearance

**Files to Create**:
1. `backend/seeders/headerConfiguration.seeder.js`
2. `backend/seeders/footerConfiguration.seeder.js`
3. `backend/seeders/websiteAppearance.seeder.js`

**Requirements**:
- All seeders require a User ID for `createdBy` field
- Set `status: 'draft'` and `featured: true`
- Map all data from frontend components exactly
- **⚠️ IMPORTANT**: Content seeded with `status: 'draft'` will NOT appear on frontend until status is changed to `published`. This is by design for workflow testing.

**Testing**:
- Run each seeder individually
- Verify data in database
- Test API endpoints return correct data

### Phase 2: Frontend Refactoring - Website Configuration
**Goal**: Make Header, Footer, and Appearance dynamic

**Files to Create/Modify**:
1. `frontend/lib/api.ts` - Create API service layer
2. `frontend/components/header.tsx` - Refactor to use API
3. `frontend/components/footer.tsx` - Refactor to use API
4. `frontend/app/globals.css` or `frontend/lib/theme.ts` - Apply dynamic appearance

**Requirements**:
- Preserve all design and styling
- Add loading states if needed
- Handle API errors gracefully
- Maintain TypeScript types

### Phase 3: Page Seeders
**Goal**: Create seeders for all pages

**Order of Implementation**:
1. Homepage (most complex, has 7 sections)
2. Who We Are
3. Products main page
4. Product sub-pages (PEB, Conventional Steel, etc.)
5. Projects
6. Media pages
7. Career and Contact Us
8. Thank You

**Requirements**:
- Each seeder creates a Page document
- Each seeder creates all Section documents for that page
- All sections have `status: 'draft'`
- Sections are ordered correctly
- Content matches frontend static data exactly

### Phase 4: Extended SectionTypes
**Goal**: Create all missing SectionTypes

**File to Create**:
- `backend/seeders/sectionTypesExtended.seeder.js`

**Requirements**:
- Define all new SectionTypes listed above
- Each SectionType must have proper field definitions
- Fields should match the props expected by frontend components

### Phase 5: Frontend Refactoring - Pages
**Goal**: Make all pages dynamic

**Files to Create/Modify**:
1. `frontend/components/sections/section-renderer.tsx` - Dynamic section renderer
2. All `frontend/app/**/page.tsx` files - Refactor to use API

**Requirements**:
- Create SectionRenderer component that maps `sectionTypeSlug` to component
- Refactor each page to fetch data and render sections dynamically
- Preserve all styling, animations, and interactions
- Handle loading and error states

### Phase 6: Data Migration
**Goal**: Migrate additional data (projects, certifications, customers, etc.)

**Files to Create**:
- `backend/seeders/projectsFromDataJson.seeder.js` - Migrate projects from `frontend/data.json`

**Requirements**:
- Read and parse `frontend/data.json`
- Create Project documents
- Link to existing Industries, BuildingTypes, Countries, Regions, Areas

---

## File Naming Conventions

### Backend Seeders
- **Configuration seeders**: `{modelName}.seeder.js` (e.g., `headerConfiguration.seeder.js`)
- **Page seeders**: `pages/{pageName}.seeder.js` (e.g., `pages/homepage.seeder.js`)
- **SectionType seeders**: `sectionTypesExtended.seeder.js`
- **Data migration seeders**: `{dataSource}From{source}.seeder.js` (e.g., `projectsFromDataJson.seeder.js`)

### Frontend Files
- **API service**: `lib/api.ts`
- **Section renderer**: `components/sections/section-renderer.tsx`
- **Page files**: Keep existing structure `app/**/page.tsx`

---

## Seeder Pattern

### Standard Seeder Structure

```javascript
const path = require('path');

// Load environment variables FIRST
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Require dependencies
const mongoose = require('mongoose');
const Model = require('../models/Model');
const connectDB = require('../configs/database');

// Data to seed
const dataToSeed = [
    // ... data objects
];

// Seed function
const seedData = async () => {
    try {
        // Verify MONGODB_URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await connectDB();

        console.log('Starting seeding...\n');

        // Get or create a user for createdBy field
        const User = require('../models/User');
        let user = await User.findOne({ email: 'admin@acero.com' });
        if (!user) {
            // Create a default user if needed
            // Or use existing user
        }

        // Clear existing data (if needed)
        // await Model.deleteMany({ /* conditions */ });

        // Insert data
        const inserted = await Model.insertMany(
            dataToSeed.map(item => ({
                ...item,
                createdBy: user._id,
                status: 'draft', // Always draft initially
                // ... other defaults
            }))
        );

        console.log(`✓ Successfully seeded ${inserted.length} items\n`);

        // Display summary
        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedData();
}

module.exports = { seedData, dataToSeed };
```

### Page Seeder Pattern

```javascript
const Page = require('../models/Page');
const Section = require('../models/Section');
const SectionType = require('../models/SectionType');

const seedHomepage = async () => {
    try {
        await connectDB();

        // Get user
        const User = require('../models/User');
        const user = await User.findOne({ email: 'admin@acero.com' });

        // Create or get page
        let page = await Page.findOne({ slug: 'home' });
        if (!page) {
            page = await Page.create({
                title: 'Home',
                slug: 'home',
                path: '/',
                level: 0,
                order: 0,
                status: 'draft',
                createdBy: user._id
            });
        }

        // Get section types
        const heroCarouselType = await SectionType.findOne({ slug: 'hero_carousel' });
        // ... get other section types

        // Create sections
        const sections = [
            {
                pageId: page._id,
                sectionTypeSlug: 'hero_carousel',
                order: 0,
                content: {
                    slides: [/* ... */],
                    autoPlay: true,
                    interval: 5000
                },
                status: 'draft',
                createdBy: user._id
            },
            // ... more sections
        ];

        // Clear existing sections for this page
        await Section.deleteMany({ pageId: page._id });

        // Insert sections
        await Section.insertMany(sections);

        console.log('Homepage seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};
```

---

## Frontend Refactoring Pattern

### API Service Layer Pattern

**⚠️ IMPORTANT**: Always use `/api/public/*` endpoints. These automatically filter to only return published content.

```typescript
// frontend/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface HeaderConfig {
    // ... type definition
}

/**
 * Get published header configuration
 * ⚠️ Only returns published and featured header config
 */
export async function getHeaderConfig(): Promise<HeaderConfig> {
    const response = await fetch(`${API_BASE_URL}/public/header-configuration`);
    if (!response.ok) {
        // If no published config exists, this will return error
        // Handle gracefully - maybe use default/fallback
        throw new Error('Failed to fetch header config');
    }
    const data = await response.json();
    return data.data; // Adjust based on API response format
}

/**
 * Get published page by slug with published sections only
 * ⚠️ Only returns published pages and published sections
 */
export async function getPageBySlug(slug: string) {
    const response = await fetch(`${API_BASE_URL}/public/pages/slug/${slug}`);
    if (!response.ok) {
        // 404 if page doesn't exist or is not published
        if (response.status === 404) {
            throw new Error('Page not found or not published');
        }
        throw new Error('Failed to fetch page');
    }
    const data = await response.json();
    // data.data.sections will only contain published sections
    return data.data;
}

/**
 * ⚠️ NEVER use admin endpoints from frontend
 * Admin endpoints like /api/pages/:id can return draft content
 * Always use /api/public/* endpoints
 */
```

### Section Renderer Pattern

```typescript
// frontend/components/sections/section-renderer.tsx

import { HeroCarousel } from '@/components/carousel/hero-carousel';
import { ContentSection } from '@/components/sections/content-section';
// ... import all section components

interface Section {
    _id: string;
    sectionTypeSlug: string;
    content: any;
    order: number;
}

interface SectionRendererProps {
    section: Section;
}

export function SectionRenderer({ section }: SectionRendererProps) {
    const { sectionTypeSlug, content } = section;

    // Map sectionTypeSlug to component
    switch (sectionTypeSlug) {
        case 'hero_carousel':
            return <HeroCarousel slides={content.slides} autoPlay={content.autoPlay} interval={content.interval} />;
        
        case 'content_with_image':
            return (
                <ContentSection
                    title={content.title}
                    paragraphs={content.paragraphs}
                    image={content.image}
                    imageAlt={content.imageAlt}
                    layout={content.layout}
                    cta={content.cta}
                />
            );
        
        // ... handle all section types
        
        default:
            console.warn(`Unknown section type: ${sectionTypeSlug}`);
            return null;
    }
}
```

### Page Refactoring Pattern

```typescript
// frontend/app/page.tsx (Before)
export default function Home() {
    return (
        <>
            <Header />
            <main>
                <HeroCarousel slides={heroSlides} />
                <ContentSection title="..." />
                {/* ... more static sections */}
            </main>
            <Footer />
        </>
    );
}

// frontend/app/page.tsx (After)
'use client';

import { useEffect, useState } from 'react';
import { getPageBySlug } from '@/lib/api';
import { SectionRenderer } from '@/components/sections/section-renderer';

export default function Home() {
    const [page, setPage] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPage() {
            try {
                const pageData = await getPageBySlug('home');
                setPage(pageData);
                setSections(pageData.sections || []);
            } catch (error) {
                console.error('Failed to fetch page:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchPage();
    }, []);

    if (loading) {
        return <div>Loading...</div>; // Or use a loading component
    }

    return (
        <>
            <Header />
            <main className="min-h-screen bg-background">
                {sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                        <SectionRenderer key={section._id} section={section} />
                    ))}
            </main>
            <Footer />
        </>
    );
}
```

---

## Testing Strategy

### 1. Seeder Testing
- Run each seeder individually
- Verify data in MongoDB
- Check all required fields are populated
- Verify relationships (pageId, createdBy, etc.)

### 2. API Testing
- Test all public API endpoints
- Verify response format matches frontend expectations
- Test with Postman or similar tool

### 3. Frontend Testing
- Test each page renders correctly
- Verify all sections display properly
- Check loading states
- Test error handling
- Verify design remains intact (visual comparison)
- **⚠️ CRITICAL**: Verify that draft content does NOT appear on frontend (only published content should be visible)

### 4. Workflow Testing
- Test draft → published workflow
- **Verify only published content shows on frontend** - This is critical!
- Test status transitions (draft → in_review → pending_approval → pending_publish → published)
- Verify that changing status from published to draft removes content from frontend
- Test that public API endpoints return 404 or empty results for draft content

---

## Important Notes and Constraints

### ⚠️ CRITICAL SECURITY REQUIREMENT: Published Data Only

**ALL public API routes MUST ONLY return published data. This is non-negotiable.**

#### What This Means:
- **Pages**: Only pages with `status: 'published'` and `isActive: true` are returned
- **Sections**: Only sections with `status: 'published'` and `isVisible: true` are returned
- **Header/Footer/Appearance**: Only configurations with `status: 'published'`, `featured: true`, and `isActive: true` are returned
- **Projects, Vacancies, Company Updates, etc.**: Only items with `status: 'published'` and `featured: true` are returned
- **Draft content**: NEVER accessible through public routes, even if it exists in the database

#### Implementation:
- All public routes in `backend/routes/publicRoutes.js` filter by `status: 'published'`
- Model static methods like `getPublished()`, `getPublishedSections()`, `getPublishedTree()` enforce this
- Frontend should ONLY use `/api/public/*` endpoints, never admin endpoints
- If content doesn't appear on frontend, check its status - it must be `published`

#### Testing This:
1. Create content with `status: 'draft'` → Should NOT appear on frontend
2. Change status to `published` → Should appear on frontend
3. Change back to `draft` → Should disappear from frontend
4. Public API should return 404 or empty results for draft content

### Critical Constraints
1. **NO DESIGN CHANGES**: The design must remain 100% identical. Only data source changes.
2. **All content in draft**: Initially, all seeded content should have `status: 'draft'` for workflow testing.
3. **User requirement**: All seeders need a User ID for `createdBy` field. Ensure a user exists or create one.
4. **SectionType dependency**: SectionTypes must be seeded before Sections.
5. **Page dependency**: Pages must be created before Sections.
6. **⚠️ PUBLISHED DATA ONLY**: All public API routes (`/api/public/*`) MUST ONLY return data with `status: 'published'`. Draft content is NEVER exposed to the frontend through public routes. This is a security and content management requirement.

### Data Mapping Rules
1. **Exact mapping**: Map frontend static data exactly to backend structure.
2. **Image paths**: Keep image paths as-is (they may need to be uploaded to Cloudinary later).
3. **Component props**: Section content should match the props expected by frontend components.
4. **Order matters**: Section order must match the frontend display order.

### Implementation Order
1. Phase 1: Website Configuration (Header, Footer, Appearance)
2. Phase 2: Frontend Refactoring for Configuration
3. Phase 4: Extended SectionTypes (before pages)
4. Phase 3: Page Seeders (one by one)
5. Phase 5: Frontend Page Refactoring (matching seeders)
6. Phase 6: Data Migration (projects, etc.)

### Environment Setup
- Backend requires `.env` file with `MONGODB_URI`
- Frontend requires `.env.local` with `NEXT_PUBLIC_API_URL` (optional, defaults to localhost:5000)
- Ensure database is running before seeding

### API Endpoints to Verify
**⚠️ IMPORTANT: All public endpoints ONLY return published data**

- `GET /api/public/header-configuration` - Get **published** header config (status: 'published', featured: true)
- `GET /api/public/footer-configuration` - Get **published** footer config (status: 'published', featured: true)
- `GET /api/public/website-appearance` - Get **published** appearance (status: 'published', featured: true)
- `GET /api/public/pages/slug/:slug` - Get **published** page with **published** sections only
- `GET /api/public/pages/tree` - Get **published** page tree for navigation
- `GET /api/public/pages/:id/sections` - Get **published** sections for a **published** page
- `GET /api/public/projects` - Get **published** and featured projects only
- `GET /api/public/vacancies` - Get **published** and featured vacancies only
- `GET /api/public/company-updates` - Get **published** and featured company updates only
- All other public endpoints follow the same pattern

**Draft content is NEVER accessible through public routes.**

---

## Troubleshooting

### Common Issues

#### Seeder Fails - User Not Found
**Solution**: Create a user first or modify seeder to use existing user:
```javascript
const User = require('../models/User');
let user = await User.findOne({ email: 'admin@acero.com' });
if (!user) {
    // Create user or use different email
}
```

#### SectionType Not Found
**Solution**: Ensure SectionTypes are seeded before Sections:
```javascript
const sectionType = await SectionType.findOne({ slug: 'hero_carousel' });
if (!sectionType) {
    throw new Error('SectionType hero_carousel not found. Seed SectionTypes first.');
}
```

#### Frontend API Errors
**Solution**: 
- Check API base URL is correct
- Verify backend server is running
- Check CORS settings
- Verify API endpoint exists and returns correct format

#### Design Looks Different
**Solution**: 
- Verify component props match exactly
- Check CSS classes are preserved
- Ensure no styling was accidentally removed
- Compare with original static version

#### Sections Not Rendering
**Solution**:
- Check SectionRenderer maps all section types
- Verify section content structure matches component props
- Check console for errors
- Verify sections are fetched correctly from API
- **⚠️ IMPORTANT**: Ensure sections have `status: 'published'` - draft sections will not be returned by public API

#### Draft Content Appearing on Frontend
**Solution**:
- This should NEVER happen! If it does, there's a security issue.
- Verify public API routes filter by `status: 'published'`
- Check that you're using `/api/public/*` endpoints, not admin endpoints
- Verify model static methods like `getPublished()` are being used
- Check database to ensure content status is actually 'draft', not 'published'

---

## Quick Reference

### Running Seeders
```bash
cd backend
node seeders/headerConfiguration.seeder.js
node seeders/pages/homepage.seeder.js
```

### Testing API
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

### Database Models
- `Page` - Pages in the site
- `Section` - Sections within pages
- `SectionType` - Schema definitions for sections
- `HeaderConfiguration` - Header settings
- `FooterConfiguration` - Footer settings
- `WebsiteAppearance` - Appearance settings

### Key Files
- **Backend Models**: `backend/models/`
- **Backend Seeders**: `backend/seeders/`
- **Backend Routes**: `backend/routes/`
- **Frontend Pages**: `frontend/app/`
- **Frontend Components**: `frontend/components/`
- **Frontend API**: `frontend/lib/api.ts`

---

## Next Steps After Completion

1. **Test Workflow**: Test the complete draft → published workflow
2. **Verify Published-Only Access**: Ensure all public routes only return published content
3. **Upload Media**: Upload images to Cloudinary and update URLs
4. **Content Review**: Review all content in CMS admin panel
5. **Publish Content**: Change status from `draft` to `published` when ready
   - **⚠️ IMPORTANT**: Only after publishing will content appear on frontend
   - Draft content will remain hidden from public view
6. **Performance**: Optimize API calls and add caching if needed
7. **Documentation**: Update any additional documentation as needed

---

**Last Updated**: 2024-12-19
**Status**: In Progress
**Current Phase**: Planning

---

## Related Documents

- **Plan File**: The implementation plan (created via mcp_create_plan) should also reference this critical requirement about published data only
- **Backend Routes**: `backend/routes/publicRoutes.js` - All public endpoints enforce published-only access
- **Model Methods**: Check model static methods like `getPublished()`, `getPublishedSections()`, `getPublishedTree()` for implementation details

