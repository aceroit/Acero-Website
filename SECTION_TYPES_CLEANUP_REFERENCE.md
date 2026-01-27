# Section Types Cleanup Reference

Section types used on the **live website** are those that have a matching `case` in the frontend section-renderer.

## Section Types in Use (24)

| Slug | Description |
|------|--------------|
| `hero_carousel` | Hero carousel |
| `content_with_image` | Content + image |
| `statistics` | Stats block |
| `infinite_carousel` | Infinite carousel |
| `projects_grid` | Projects grid |
| `company_updates` | Company updates |
| `hero_image` | Hero image |
| `premium_video` | Premium video |
| `image_gallery` | Image gallery |
| `features_grid` | Features grid |
| `product_card` | Product card |
| `image_modal_gallery` | Image modal gallery |
| `tabbed_comparison` | Tabbed comparison |
| `flip_card` | Flip card |
| `advantages_grid` | Advantages grid |
| `application_cards` | Application cards |
| `circular_advantages` | Circular advantages |
| `peb_advantage_svg` | PEB advantage SVG |
| `certificates_grid` | Certificates grid |
| `video_cards` | Video cards |
| `image_display` | Image display |
| `hover_card` | Hover card |
| `comparison_table` | Comparison table |
| `cta` | Call to action |

Source: `frontend/components/sections/section-renderer.tsx` (switch on `sectionTypeSlug`).

---

## How to Clean Up

**1. Reseed only these 24 types** (replaces all system section types):

```bash
cd backend
npm run seed:section-types
```

**2. Or only remove unused types** (keeps existing allowed types, deletes the rest):

```bash
cd backend
npm run cleanup:section-types
```

- If any section still uses a removed type, the script logs them and exits. Fix or delete those sections, then run again.
- After cleanup, run `seed:section-types` if you need to (re)create any missing allowed types.

---

## Files

| File | Purpose |
|------|---------|
| `backend/seeders/sectionTypesConsolidated.seeder.js` | Seeds the 24 allowed types (pulls from sectionTypes + sectionTypesExtended). |
| `backend/scripts/cleanupUnusedSectionTypes.js` | Deletes SectionType docs whose slug is not in the list above. |
