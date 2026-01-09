# ACERO Admin Panel - Design System

## Overview
This document defines the design system and color scheme for the ACERO Admin Panel. All future development should follow these guidelines to maintain consistency and professional appearance.

## Color Palette

### Primary Colors
- **Sidebar Background**: `bg-gray-800` (#1f2937)
- **Main Content Background**: `bg-gray-100` (#f3f4f6)
- **Card Background**: `bg-white` (#ffffff)
- **Primary Button**: `bg-gray-800` (#1f2937) with white text

### Text Colors
- **Primary Text**: `text-gray-900` (#111827) - For main headings and important content
- **Secondary Text**: `text-gray-700` (#374151) - For body text and descriptions
- **Muted Text**: `text-gray-600` (#4b5563) - For labels and helper text
- **Light Text**: `text-gray-500` (#6b7280) - For less important information
- **White Text**: `text-white` (#ffffff) - For text on dark backgrounds (gray-800)

### Border Colors
- **Card Borders**: `border-gray-200` (#e5e7eb)
- **Input Borders**: `border-gray-300` (#d1d5db)
- **Hover Borders**: `border-gray-400` (#9ca3af)

### Background Colors
- **Hover States**: `bg-gray-50` (#f9fafb) - For light hover effects
- **Table Headers**: `bg-gray-50` (#f9fafb)
- **Table Row Hover**: `bg-gray-50` (#f9fafb)
- **Info Sections**: `bg-gray-50` (#f9fafb)

### Accent Colors (For Icons and Highlights)
- **Blue**: `bg-blue-100` with `text-blue-600` - For user-related actions
- **Purple**: `bg-purple-100` with `text-purple-600` - For permission-related actions
- **Green**: `bg-green-100` with `text-green-600` - For success/positive actions
- **Red**: `bg-red-100` with `text-red-600` - For danger/delete actions
- **Orange**: `bg-orange-100` with `text-orange-600` - For warnings

### Role Badge Colors
- **Super Admin**: Red (`color="red"`)
- **Admin**: Blue (`color="blue"`)
- **Approver**: Purple (`color="purple"`)
- **Reviewer**: Orange (`color="orange"`)
- **Editor**: Green (`color="green"`)
- **Viewer**: Default/Gray (`color="default"`)

## Typography

### Font Sizes
- **Page Title**: `text-2xl md:text-4xl` (24px/36px) - Bold
- **Section Title**: `text-lg` (18px) - Semibold
- **Card Title**: `text-lg` (18px) - Semibold
- **Body Text**: `text-sm md:text-base` (14px/16px) - Regular
- **Small Text**: `text-sm` (14px) - Regular

### Font Weights
- **Bold**: `font-bold` (700) - For main headings
- **Semibold**: `font-semibold` (600) - For section titles and labels
- **Medium**: `font-medium` (500) - For emphasis
- **Regular**: Default (400) - For body text

## Component Styles

### Cards
```jsx
<Card className="border border-gray-200 shadow-md bg-white">
  {/* Content */}
</Card>
```
- Background: White
- Border: `border-gray-200`
- Shadow: `shadow-md`
- Hover: `hover:shadow-lg`

### Buttons

#### Primary Button
```jsx
<Button
  type="primary"
  className="text-white"
  style={{
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
    height: '44px',
    borderRadius: '8px',
    fontWeight: '600'
  }}
>
  Button Text
</Button>
```

#### Secondary Button
```jsx
<Button
  onClick={handleClick}
  disabled={loading}
  size="large"
>
  Cancel
</Button>
```

### Tables
- Background: White
- Header Background: `bg-gray-50`
- Header Text: `text-gray-900` (dark)
- Row Text: `text-gray-900` (dark)
- Row Hover: `bg-gray-50`
- Borders: `border-gray-200` for headers, `border-gray-100` for rows

### Input Fields
- Background: White
- Border: `border-gray-300`
- Text: `text-gray-900`
- Placeholder: `text-gray-500`
- Focus Border: `border-gray-400`
- Hover: `border-gray-400`

### Modals
- Background: White
- Title: `text-gray-900` - Semibold
- Footer: White background with buttons aligned right
- Border: Default Ant Design modal border

## Layout Guidelines

### Spacing
- **Page Padding**: `p-4 md:p-0` (16px on mobile, 0 on desktop)
- **Section Spacing**: `space-y-6 md:space-y-8` (24px/32px vertical)
- **Card Padding**: `p-6` (24px)
- **Element Gap**: `gap-3` or `gap-4` (12px/16px)

### Grid System
- Use Ant Design's `Row` and `Col` components
- Responsive breakpoints:
  - `xs={24}` - Full width on mobile
  - `sm={12}` - Half width on small screens
  - `md={6}` or `md={8}` - Column width on medium screens
  - `lg={12}` - Half width on large screens

## Special Components

### Welcome Banner
- Background: `bg-gray-800` (matches sidebar)
- Text: White with high contrast
- Padding: `p-6 md:p-8`
- Border Radius: `rounded-2xl`

### Stats Cards
- Background: White
- Icon Background: `bg-gray-800` with white icon
- Value: Large, bold, dark text
- Title: Medium gray text

### Permission Matrix
- Table Background: White
- Role Headers: `bg-gray-800` with white text
- Resource Column: `bg-gray-800` with white text (sticky)
- Permission Tags: Small, compact badges in `bg-gray-800` with white text
- Empty State: Gray dash (`—`) in muted color

### Action Menus
- Use three-dot menu (MoreOutlined icon)
- Dropdown: White background with proper hover states
- Menu Items: Dark text with light gray hover

## Hover States

### Cards
- Shadow: `hover:shadow-lg`
- Background: No change (stays white)

### Buttons
- Primary: `hover:bg-gray-700` (slightly lighter gray-800)
- Secondary: `hover:bg-gray-50`

### Table Rows
- Background: `hover:bg-gray-50`

### Interactive Elements
- Quick Actions: `hover:bg-gray-50`
- Icon Containers: Slightly darker on hover

## Responsive Design

### Breakpoints
- **Mobile**: `< 640px` - Single column, full width elements
- **Tablet**: `640px - 1024px` - Two columns, adjusted spacing
- **Desktop**: `> 1024px` - Full layout, optimal spacing

### Mobile Considerations
- Stack elements vertically
- Full-width buttons
- Reduced padding (`p-4` instead of `p-6`)
- Smaller font sizes where appropriate

## Accessibility

### Contrast Ratios
- All text meets WCAG AA standards
- Dark text (`#111827`) on white (`#ffffff`) = 16.5:1 ✓
- White text (`#ffffff`) on gray-800 (`#1f2937`) = 12.6:1 ✓

### Interactive Elements
- Minimum touch target: 44px × 44px
- Clear focus states
- Keyboard navigation support

## Best Practices

1. **Always use white cards** on the light gray background
2. **Use dark text** (`text-gray-900` or `text-gray-700`) on light backgrounds
3. **Use white text** only on dark backgrounds (gray-800)
4. **Consistent button styling** - All primary buttons use gray-800
5. **Proper spacing** - Use consistent gaps and padding
6. **Hover states** - Always use light gray (`bg-gray-50`) for hover on white backgrounds
7. **Borders** - Use subtle gray borders (`border-gray-200`) for definition
8. **Shadows** - Use `shadow-md` for cards, `shadow-lg` on hover

## Examples

### Card Component
```jsx
<Card className="border border-gray-200 shadow-md bg-white">
  <div className="p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
    <p className="text-gray-700">Content here</p>
  </div>
</Card>
```

### Primary Button
```jsx
<Button
  type="primary"
  size="large"
  className="text-white"
  style={{
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
    height: '44px',
    borderRadius: '8px',
    fontWeight: '600'
  }}
>
  Action
</Button>
```

### Table
```jsx
<Table
  className="custom-table"
  columns={columns}
  dataSource={data}
  rowKey="id"
/>
```

## Color Reference Table

| Element | Color Class | Hex Code | Usage |
|---------|------------|----------|-------|
| Sidebar | `bg-gray-800` | #1f2937 | Navigation sidebar |
| Main BG | `bg-gray-100` | #f3f4f6 | Main content area |
| Cards | `bg-white` | #ffffff | All card backgrounds |
| Primary Text | `text-gray-900` | #111827 | Headings, important text |
| Secondary Text | `text-gray-700` | #374151 | Body text |
| Muted Text | `text-gray-600` | #4b5563 | Labels, helper text |
| Borders | `border-gray-200` | #e5e7eb | Card borders |
| Hover | `bg-gray-50` | #f9fafb | Hover states |
| Primary Button | Custom | #1f2937 | All primary actions |

---

**Last Updated**: 2024
**Version**: 1.0

