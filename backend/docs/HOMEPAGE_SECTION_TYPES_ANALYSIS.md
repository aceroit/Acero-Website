# Homepage Section Types Analysis

## Overview
This document analyzes all 7 homepage section types, comparing their SectionType schemas with the frontend component requirements to identify missing fields and field mapping differences.

---

## Section 1: Hero Carousel (`hero_carousel`)

### SectionType Schema
- `slides` (JSON, required): Array of slide objects
- `autoPlay` (boolean, optional, default: true)
- `interval` (number, optional, default: 5000)

### Frontend Component: `HeroCarousel`
**Props**: `{ slides: HeroCarouselSlide[], autoPlay?: boolean, interval?: number }`

**HeroCarouselSlide Interface**:
```typescript
{
  image: string
  title: string
  description: string
}
```

### Analysis
✅ **MATCH**: SectionType schema matches frontend component perfectly.

**HelpText Format**: `[{"image": "url", "title": "Title", "description": "Description"}]` ✅ Correct

---

## Section 2: Content with Image (`content_with_image`)

### SectionType Schema
- `title` (text, required)
- `paragraphs` (array, required): Array of text paragraphs
- `image` (image, optional)
- `imageAlt` (text, optional)
- `layout` (select, optional, default: "image-right")
- `cta` (JSON, optional): `{"label": "Learn More", "href": "/products"}`
- `variant` (select, optional, default: "default")

### Frontend Component: `ContentSection`
**Props**: 
```typescript
{
  title: string
  paragraphs: string[]
  cta?: { label: string, href: string }
  image?: string
  imageAlt?: string
  layout?: "image-left" | "image-right" | "image-center" | "text-only" | "split"
  variant?: "default" | "accent" | "muted"
}
```

### Analysis
✅ **MATCH**: SectionType schema matches frontend component perfectly.

**Note**: The `paragraphs` field is type `array` in SectionType, which should store an array of strings. This matches the frontend requirement.

---

## Section 3: Statistics (`statistics`)

### SectionType Schema
- `heading` (text, optional): Section heading
- `stats` (JSON, required): Array of stat objects
- `columns` (number, optional, default: 4, min: 2, max: 4)
- `backgroundColor` (color, optional, default: "#f8f9fa")

**HelpText Format**: `[{"number": "75+", "label": "Years Experience", "description": "Serving industry since 1950"}]`

### Frontend Component: `StatsDisplay`
**Props**:
```typescript
{
  stats: Stat[]
  columns?: 3 | 4
  className?: string
}

interface Stat {
  value: string      // ❌ SectionType uses "number"
  label: string      // ✅ Matches
  sublabel?: string  // ❌ SectionType uses "description"
  icon?: React.ReactNode
}
```

### Analysis
❌ **FIELD MAPPING MISMATCH**:

1. **`number` vs `value`**: SectionType expects `number` field, but frontend uses `value`
2. **`description` vs `sublabel`**: SectionType expects `description` field, but frontend uses `sublabel`
3. **`heading` field**: Frontend component doesn't use a heading prop - it's always null/undefined
4. **`columns` type**: SectionType uses `number` (2-4), frontend uses `3 | 4` (union type)
5. **`backgroundColor`**: Frontend doesn't use this prop - it uses CSS classes

### Required Action
- **Option 1**: Update SectionType helpText to use `value` and `sublabel` instead of `number` and `description`
- **Option 2**: Document the mapping in seeder (use `value`/`sublabel` in data, SectionType helpText is just documentation)
- **Recommendation**: Update SectionType helpText to match frontend exactly

---

## Section 4 & 6: Infinite Carousel (`infinite_carousel`)

### SectionType Schema
- `title` (text, optional): Section title
- `items` (JSON, required): Array of item objects
- `speed` (select, optional, default: "medium"): "slow" | "medium" | "fast"
- `direction` (select, optional, default: "left"): "left" | "right"
- `pauseOnHover` (boolean, optional, default: true)

**HelpText Format**: `[{"image": "url", "alt": "Alt text", "width": 200, "height": 100}]`

### Frontend Component: `InfiniteCarousel`
**Props**:
```typescript
{
  items: InfiniteCarouselItem[]
  speed?: "slow" | "medium" | "fast"
  direction?: "left" | "right"
  pauseOnHover?: boolean
  className?: string
  itemClassName?: string  // ❌ MISSING in SectionType
}

interface InfiniteCarouselItem {
  image: string
  alt: string
  width?: number
  height?: number
}
```

### Analysis
❌ **MISSING FIELD**: `itemClassName`

**Usage in Frontend**:
- Certifications: `itemClassName="h-20 w-32 md:h-24 md:w-40"`
- Customers: `itemClassName="h-16 w-32 md:h-20 md:w-40"`

**Note**: The frontend wraps `InfiniteCarousel` in a `<section>` with a title, but the `InfiniteCarousel` component itself doesn't take a `title` prop. The title is handled by the parent section wrapper.

### Required Action
- Add `itemClassName` field to `infinite_carousel` SectionType schema
- Type: `text` (optional)
- Label: "Item CSS Classes"
- HelpText: "CSS classes for carousel items (e.g., 'h-20 w-32 md:h-24 md:w-40')"

---

## Section 5: Projects Grid (`projects_grid`)

### SectionType Schema
- `title` (text, required)
- `subtitle` (textarea, optional)
- `projects` (JSON, required): Array of project objects
- `columns` (select, optional, default: "3"): "3" | "4"

**HelpText Format**: `[{"id": "1", "title": "Project Title", "description": "Description", "image": "url", "category": "PEB", "link": "/projects/1"}]`

### Frontend Component: `ProjectsSection`
**Props**:
```typescript
{
  projects: Project[]
  title: string
  subtitle?: string
  columns?: 3 | 4
  className?: string
}

interface Project {
  id: string
  title: string
  description: string
  image: string
  category?: string
  link?: string
}
```

### Analysis
✅ **MATCH**: SectionType schema matches frontend component perfectly.

**Note**: `columns` is stored as string "3" or "4" in SectionType, but frontend expects number `3 | 4`. This is fine as the frontend can convert string to number if needed, or the seeder should store as number in JSON.

---

## Section 7: Company Updates (`company_updates`)

### SectionType Schema
- `title` (text, required)
- `subtitle` (textarea, optional)
- `updates` (JSON, required): Array of update objects
- `columns` (select, optional, default: "3"): "3" | "4"

**HelpText Format**: `[{"id": "1", "title": "Update Title", "description": "Description", "image": "url", "date": "2024-01-15", "category": "News", "link": "/media/company-update/1"}]`

### Frontend Component: `CompanyUpdatesSection`
**Props**:
```typescript
{
  updates: CompanyUpdate[]
  title: string
  subtitle?: string
  columns?: 3 | 4
  className?: string
}

interface CompanyUpdate {
  id: string
  title: string
  description: string
  image: string
  date: Date | string  // ⚠️ Can be Date object or ISO string
  category?: string
  link?: string
}
```

### Analysis
✅ **MOSTLY MATCH**: SectionType schema matches frontend component.

**Date Format Note**: 
- SectionType helpText shows: `"date": "2024-01-15"` (ISO date string)
- Frontend accepts: `Date | string`
- ✅ This is fine - ISO date strings work with frontend's `formatDate` function

**Note**: Same `columns` type consideration as Projects Grid (string vs number).

---

## Summary of Issues

### Critical Issues

1. **Statistics Section - Field Name Mismatch**
   - SectionType expects: `{number, label, description}`
   - Frontend expects: `{value, label, sublabel}`
   - **Action Required**: Update SectionType helpText to match frontend

2. **Infinite Carousel - Missing Field**
   - Missing: `itemClassName` (text, optional)
   - **Action Required**: Add `itemClassName` field to SectionType schema

### Minor Issues

3. **Statistics Section - Unused Fields**
   - `heading`: Not used by frontend (always null)
   - `backgroundColor`: Not used by frontend (uses CSS classes)
   - **Note**: These can remain for flexibility, but won't be used by current frontend

4. **Columns Type**
   - Some sections store `columns` as string ("3" | "4")
   - Frontend expects number (3 | 4)
   - **Note**: Frontend can handle string conversion, but seeder should use numbers for consistency

---

## Recommended Actions

### Priority 1: Fix Statistics SectionType
**File**: `backend/seeders/sectionTypes.seeder.js`
- Update `stats` field helpText to use `value` and `sublabel` instead of `number` and `description`

### Priority 2: Add itemClassName to Infinite Carousel
**File**: `backend/seeders/sectionTypesExtended.seeder.js`
- Add `itemClassName` field to `infinite_carousel` SectionType

### Priority 3: Document Field Mappings
- Create mapping documentation for any fields that differ between SectionType and frontend
- Ensure seeders use correct field names matching frontend

---

## Field Mapping Reference

### Statistics Section
| SectionType Field | Frontend Field | Notes |
|------------------|---------------|-------|
| `stats[].number` | `stats[].value` | Must use `value` in data |
| `stats[].description` | `stats[].sublabel` | Must use `sublabel` in data |
| `heading` | N/A | Not used by frontend |
| `backgroundColor` | N/A | Not used by frontend |

### Infinite Carousel
| SectionType Field | Frontend Field | Notes |
|------------------|---------------|-------|
| `itemClassName` | `itemClassName` | **MISSING** - needs to be added |

---

**Last Updated**: 2024
**Status**: Analysis Complete - Ready for Implementation

