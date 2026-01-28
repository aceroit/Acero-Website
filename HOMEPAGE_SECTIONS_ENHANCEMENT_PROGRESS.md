# Homepage Sections Enhancement - Progress & Strategy

## Overview

This document tracks the progress of enhancing homepage sections (and eventually all page sections) with custom, user-friendly editors that replace JSON textarea fields with intuitive, visual editing interfaces.

## Current Status

### ✅ Completed Sections (Homepage)

All 7 homepage sections now have custom editors with smooth UI/UX:

1. **Hero Carousel** (`hero_carousel`)
   - Custom editor: `HeroCarouselSlidesEditor.jsx`
   - Features: Slide management with image upload, title, description, drag-to-reorder
   - Status: ✅ Complete

2. **Content with Image** (`content_with_image`)
   - Custom editor: `ContentWithImageEditor.jsx`
   - Features: Paragraphs editor, image upload, layout/variant selectors, CTA editor
   - Status: ✅ Complete

3. **Statistics** (`statistics`)
   - Custom editor: `StatisticsEditor.jsx`
   - Features: Statistics management with value, label, sublabel fields, columns selector
   - Status: ✅ Complete

4. **Infinite Carousel** (`infinite_carousel`)
   - Custom editor: `InfiniteCarouselEditor.jsx`
   - Features: Items editor with image upload, speed/direction settings, itemClassName
   - Status: ✅ Complete

5. **Projects Grid** (`projects_grid`)
   - Custom editor: `ProjectsGridEditor.jsx`
   - Features: Projects management with image, ID, title, description, category, link
   - Status: ✅ Complete

6. **Company Updates** (`company_updates`)
   - Custom editor: `CompanyUpdatesEditor.jsx`
   - Features: Updates management with image, ID, title, description, date picker, category, link
   - Status: ✅ Complete

### 📋 SectionType Schema Fixes

- ✅ Fixed `statistics` SectionType helpText to use `value`/`sublabel` instead of `number`/`description`
- ✅ Added `itemClassName` field to `infinite_carousel` SectionType

## Our Approach & Strategy

### Core Principle

**Replace JSON textarea fields with custom, visual editors that make content editing intuitive and error-free.**

### Pattern for Creating Custom Editors

1. **Identify the Section Type**
   - Check `backend/seeders/sectionTypesExtended.seeder.js` or `backend/seeders/sectionTypes.seeder.js`
   - Understand the field structure and frontend component requirements

2. **Create Custom Editor Component**
   - Location: `admin-panel/src/components/forms/{SectionName}Editor.jsx`
   - Use Ant Design Form components
   - Integrate with existing `ImageUpload` component for media
   - Use `Form.List` for array fields
   - Follow design guidelines from `admin-panel/DESIGN.md`

3. **Integrate into DynamicSectionForm**
   - Add import for the custom editor
   - Add detection logic in `DynamicSectionForm.jsx`
   - Return `null` for JSON fields handled by custom editors
   - Ensure form field paths match (`['content', 'fieldName']`)

4. **Key Features to Include**
   - Card-based UI for array items
   - Image uploader integration (use `ImageUpload` component)
   - Add/Remove buttons for array items
   - Clear labels and tooltips
   - Validation rules
   - Character counts where appropriate
   - Date pickers for date fields
   - Select dropdowns for options

### Design Guidelines Compliance

All custom editors must follow:
- **Primary Buttons**: `backgroundColor: '#1f2937'` (gray-800)
- **Cards**: White background (`bg-white`), gray borders (`border-gray-200`)
- **Text Colors**: Dark text on light backgrounds (`text-gray-700`, `text-gray-900`)
- **Spacing**: Consistent padding and margins
- **Hover States**: Light gray hover (`bg-gray-50`)

## File Structure

```
admin-panel/src/components/forms/
├── DynamicSectionForm.jsx          # Main form component (detects section types)
├── HeroCarouselSlidesEditor.jsx     # Hero carousel custom editor
├── HeroCarouselSlidesEditor.css
├── ContentWithImageEditor.jsx       # Content with image custom editor
├── ContentWithImageEditor.css
├── StatisticsEditor.jsx             # Statistics custom editor
├── StatisticsEditor.css
├── InfiniteCarouselEditor.jsx      # Infinite carousel custom editor
├── InfiniteCarouselEditor.css
├── ProjectsGridEditor.jsx          # Projects grid custom editor
├── ProjectsGridEditor.css
├── CompanyUpdatesEditor.jsx        # Company updates custom editor
└── CompanyUpdatesEditor.css
```

## Integration Pattern

### Step 1: Import in DynamicSectionForm.jsx

```javascript
import {SectionName}Editor from './{SectionName}Editor';
```

### Step 2: Add Detection Logic

```javascript
// Special handling for {section_slug} section type - use custom editor
if (sectionType.slug === '{section_slug}') {
  return (
    <{SectionName}Editor
      value={initialContent}
      onChange={(newContent) => {
        form.setFieldsValue({
          content: newContent,
        });
      }}
      form={form}
    />
  );
}
```

### Step 3: Handle JSON Fields

```javascript
case 'json':
  // Special handling for {section_slug} {fieldName} field
  if (sectionType?.slug === '{section_slug}' && fieldName === '{fieldName}') {
    // This will be handled by {SectionName}Editor
    return null;
  }
  // ... rest of JSON handling
```

## Seeded Pages Reference

The following pages have been seeded with sections. Each page needs custom editors for its sections:

### ✅ Homepage (`/`)
- **Status**: All 7 sections have custom editors ✅
- **Sections**: Hero Carousel, Content with Image, Statistics, Infinite Carousel (Certifications), Projects Grid, Infinite Carousel (Customers), Company Updates

### 📋 Who We Are (`/who-we-are`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/whoWeAre.seeder.js`
- **Sections**: Hero Image, Content with Image (multiple), Premium Video, Image Gallery, Features Grid

### 📋 Products Main (`/products`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/products.seeder.js`
- **Sections**: Hero Image, Product Cards, Content with Image

### 📋 Products PEB (`/products/peb`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/productsPeb.seeder.js`
- **Sections**: Hero Image, Product Card, Image Modal Gallery, Application Cards, Circular Advantages, Content with Image

### 📋 Products Racking Systems (`/products/racking-systems`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/productsRackingSystems.seeder.js`
- **Sections**: Hero Image, Product Card, Image Modal Gallery, Application Cards, Content with Image

### 📋 Products PEB Comparison (`/products/peb-comparison`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/productsPebComparison.seeder.js`
- **Sections**: Hero Image, Content with Image, Comparison Table

### 📋 Projects (`/projects`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/projects.seeder.js`
- **Sections**: Hero Image, Projects Grid with Filters

### 📋 Media Literature (`/media/literature`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/mediaLiterature.seeder.js`
- **Sections**: Hero Image, Brochure Cards

### 📋 Media Video (`/media/video`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/mediaVideo.seeder.js` (if exists)
- **Sections**: Hero Image, Video Cards

### 📋 Media Company Update (`/media/company-update`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/mediaCompanyUpdate.seeder.js` (if exists)
- **Sections**: Hero Image, Company Updates List, LinkedIn Posts

### 📋 Career (`/career`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/career.seeder.js` (if exists)
- **Sections**: Hero Image, Career Application Form

### 📋 Contact Us (`/contact-us`)
- **Status**: Needs custom editors
- **Seeder**: `backend/seeders/pages/contactUs.seeder.js` (if exists)
- **Sections**: Hero Image, Head Office Section, Branch Selector, Contact Form, Full Width Map

## Future Work

### Remaining Homepage Sections

All homepage sections are complete! ✅

### Other Pages to Enhance

Based on the plan document, we need to create custom editors for sections on:

1. **Who We Are Page** (`/who-we-are`)
   - Hero Image
   - Content with Image (multiple instances)
   - Premium Video
   - Image Gallery
   - Features Grid

2. **Products Pages** (`/products`, `/products/peb`, etc.)
   - Hero Image
   - Product Card
   - Image Modal Gallery
   - Application Cards
   - Circular Advantages
   - Content with Image

3. **Projects Page** (`/projects`)
   - Hero Image
   - Projects Grid with Filters

4. **Media Pages** (`/media/literature`, `/media/video`, `/media/company-update`)
   - Hero Image
   - Brochure Cards
   - Video Cards
   - Company Updates List
   - LinkedIn Posts

5. **Career Page** (`/career`)
   - Hero Image
   - Career Application Form

6. **Contact Us Page** (`/contact-us`)
   - Hero Image
   - Head Office Section
   - Branch Selector
   - Contact Form
   - Full Width Map

### Priority Order

1. ✅ **Homepage** - COMPLETE (all 7 sections)
2. **Who We Are** - Next priority (similar sections to homepage)
3. **Products Pages** - High priority (multiple product pages)
4. **Projects Page** - Medium priority
5. **Media Pages** - Medium priority
6. **Career & Contact** - Lower priority (form-heavy sections)

## Common Section Types Needing Custom Editors

### Already Created
- ✅ `hero_carousel`
- ✅ `content_with_image`
- ✅ `statistics`
- ✅ `infinite_carousel`
- ✅ `projects_grid`
- ✅ `company_updates`

### Need Custom Editors

1. **`hero_image`** - Simple hero with image and title
   - Fields: image, title, overlay (boolean)
   - Simple editor needed

2. **`premium_video`** - Video section with YouTube embed
   - Fields: videoId, title, autoplay, muted, loop
   - Video ID input with preview

3. **`image_gallery`** - Image gallery
   - Fields: images (array), columns
   - Similar to infinite carousel items editor

4. **`image_modal_gallery`** - Gallery with modal
   - Fields: title, images (array), columns
   - Image management with captions

5. **`features_grid`** - Features grid
   - Fields: title, features (array with icon, title, description), columns
   - Feature cards editor

6. **`product_card`** - Product card section
   - Fields: title, paragraphs, image, imageAlt, cta, layout
   - Similar to content_with_image

7. **`application_cards`** - Application icons grid
   - Fields: title, applications (array), columns
   - Application cards with icons

8. **`circular_advantages`** - Circular advantages
   - Fields: title, advantages (array)
   - Advantage cards editor

9. **`brochure_cards`** - Brochure cards grid
   - Fields: brochures (array from API or static)
   - Brochure management

10. **`video_cards`** - Video cards grid
    - Fields: videos (array from API or static)
    - Video management

11. **`company_updates_list`** - Company updates list view
    - Fields: updates (array)
    - Similar to company_updates but different layout

12. **`linkedin_posts`** - LinkedIn posts section
    - Fields: posts (array)
    - Social media posts management

13. **`career_application_form`** - Career form
    - Fields: formConfig (JSON)
    - Form builder or configuration editor

14. **`head_office_section`** - Head office info
    - Fields: address, phone, email, etc.
    - Contact information editor

15. **`branch_selector`** - Branch selector with accordion
    - Fields: branches (array from API)
    - Branch management

16. **`contact_form`** - Contact form
    - Fields: formConfig (JSON)
    - Form configuration editor

17. **`full_width_map`** - Full width Google Maps
    - Fields: mapConfig (JSON with API key, center, zoom)
    - Map configuration editor

18. **`thank_you_content`** - Thank you page content
    - Fields: title, message, cta
    - Simple content editor

19. **`projects_grid_with_filters`** - Projects with filters
    - Fields: title, filters, projects (from API)
    - Filter configuration editor

## Best Practices

### 1. Image Upload Integration

Always use the existing `ImageUpload` component:

```javascript
import ImageUpload from '../common/ImageUpload';

<Form.Item
  name={['content', 'image']}
  valuePropName="value"
  getValueFromEvent={(imageData) => {
    return imageData?.url || '';
  }}
  getValueProps={(value) => {
    return {
      value: value ? { url: value } : null
    };
  }}
>
  <ImageUpload
    folder="section-name"
    label=""
    maxSize={10}
  />
</Form.Item>
```

### 2. Array Field Management

Use `Form.List` for array fields:

```javascript
<Form.List name={['content', 'items']} initialValue={value.items || []}>
  {(fields, { add, remove, move }) => {
    return (
      // Render fields with add/remove buttons
    );
  }}
</Form.List>
```

### 3. Date Fields

Use DatePicker with proper normalization:

```javascript
<Form.Item
  name={['content', 'date']}
  getValueProps={(value) => ({
    value: value ? dayjs(value) : null,
  })}
  normalize={(value) => {
    if (!value) return null;
    return value.format('YYYY-MM-DD');
  }}
>
  <DatePicker
    size="large"
    style={{ width: '100%' }}
    format="YYYY-MM-DD"
  />
</Form.Item>
```

### 4. Validation

Always add validation rules:

```javascript
rules={[
  { required: true, message: 'Field is required' },
  { maxLength: 200, message: 'Maximum 200 characters' }
]}
```

### 5. Tooltips and Help Text

Provide helpful tooltips:

```javascript
tooltip="Helpful description of what this field does"
```

## Testing Checklist

For each custom editor:

- [ ] Can add new items
- [ ] Can remove items
- [ ] Can edit all fields
- [ ] Image uploader works correctly
- [ ] Form validation works
- [ ] Data saves correctly
- [ ] Data loads correctly when editing
- [ ] No console errors
- [ ] Follows design guidelines
- [ ] Responsive on mobile

## Common Issues & Solutions

### Issue: Image not displaying after upload

**Solution**: Ensure `getValueFromEvent` returns the URL string, and `getValueProps` converts it back to object format for ImageUpload component.

### Issue: Array items not saving

**Solution**: Verify `Form.List` name path matches form structure: `['content', 'fieldName']`

### Issue: Date field not working

**Solution**: Use `getValueProps` to convert string to dayjs object, and `normalize` to convert back to string format.

### Issue: Form not updating when adding items

**Solution**: Ensure `onChange` callback updates form values using `form.setFieldsValue()`

## Implementation Examples

### Example 1: Simple Array Editor (Infinite Carousel)

```javascript
// InfiniteCarouselEditor.jsx pattern
<Form.List name={['content', 'items']}>
  {(fields, { add, remove }) => (
    // Each item has: image, alt
    // Use ImageUpload component
    // Add/Remove buttons
  )}
</Form.List>
```

### Example 2: Complex Array Editor (Hero Carousel)

```javascript
// HeroCarouselSlidesEditor.jsx pattern
<Form.List name={['content', 'slides']}>
  {(fields, { add, remove, move }) => (
    // Each slide has: image, title, description
    // Use ImageUpload component
    // Add/Remove/Move buttons
  )}
</Form.List>
```

### Example 3: Mixed Fields Editor (Content with Image)

```javascript
// ContentWithImageEditor.jsx pattern
// Has: title, paragraphs (array), image, layout, variant, cta (object)
// Paragraphs use Form.List
// CTA uses nested Form.Item paths: ['content', 'cta', 'label']
```

## Next Steps

1. **Test all homepage sections** - Verify all 7 custom editors work correctly
2. **Fix any bugs** - Address any issues found during testing
3. **Move to Who We Are page** - Create custom editors for who-we-are sections
4. **Continue page by page** - Follow the priority order above

## Quick Reference: How to Add a New Custom Editor

1. **Check SectionType**: Find the section type in `backend/seeders/sectionTypesExtended.seeder.js`
2. **Check Frontend Component**: Review `frontend/components/sections/{component-name}.tsx` to understand data structure
3. **Create Editor File**: `admin-panel/src/components/forms/{SectionName}Editor.jsx`
4. **Create CSS File**: `admin-panel/src/components/forms/{SectionName}Editor.css`
5. **Import in DynamicSectionForm**: Add import statement
6. **Add Detection Logic**: Add `if (sectionType.slug === 'section_slug')` block
7. **Handle JSON Fields**: Return `null` for JSON fields handled by custom editor
8. **Test**: Verify add/edit/remove/save all work correctly

## Reference Files

- **Design Guidelines**: `admin-panel/DESIGN.md`
- **Workflow Integration**: `WORKFLOW_INTEGRATION_GUIDE.md`
- **SectionType Analysis**: `backend/docs/HOMEPAGE_SECTION_TYPES_ANALYSIS.md`
- **Main Plan**: `c:\Users\jayesh.r\.cursor\plans\backend_frontend_data_mapping_d7c7dbfc.plan.md`

## Notes

- All custom editors must maintain backward compatibility with existing data
- No backend changes required - only frontend UI improvements
- All editors integrate with existing form system
- Follow Ant Design patterns and design guidelines
- Ensure smooth, intuitive user experience

---

**Last Updated**: 2024
**Status**: Homepage sections complete, ready to proceed with other pages
**Next Priority**: Who We Are page sections

