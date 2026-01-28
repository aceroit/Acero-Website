# Frontend Design Documentation

## Overview

The Acero Website frontend is a modern, high-performance Next.js application built with TypeScript, featuring a premium design system, smooth animations, and full dark/light mode support. The application is designed for a steel manufacturing company with an industrial, professional aesthetic.

## Technology Stack

### Core Framework
- **Next.js**: 16.0.10 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Node.js**: Compatible with Node 18+

### Styling & Design
- **Tailwind CSS**: 4.1.9 (latest version with new PostCSS plugin)
- **PostCSS**: 8.5+ with `@tailwindcss/postcss` plugin
- **tailwindcss-animate**: 1.0.7 (animation utilities)
- **tw-animate-css**: 1.3.3 (additional animation classes)

### Animation Libraries
- **Framer Motion**: 12.27.0 (component animations and transitions)
- **Lenis**: 1.3.17 (smooth scrolling library)

### UI Component Library
- **shadcn/ui**: New York style variant
- **Radix UI**: Comprehensive set of accessible primitives
- **Lucide React**: 0.454.0 (icon library)

### Additional Libraries
- **next-themes**: 0.4.6 (theme management - custom implementation used instead)
- **class-variance-authority**: 0.7.1 (component variant management)
- **clsx**: 2.1.1 (conditional class names)
- **tailwind-merge**: 3.3.1 (merge Tailwind classes)
- **@vercel/analytics**: 1.3.1 (analytics tracking)

### Package Manager
- **pnpm**: Primary package manager (pnpm-lock.yaml present)

## Project Structure

```
frontend/
├── app/
│   ├── globals.css          # Main stylesheet with theme variables
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Homepage component
├── components/
│   ├── header.tsx           # Navigation header component
│   ├── footer.tsx           # Footer component
│   ├── theme-provider.tsx   # Custom theme context provider
│   ├── smooth-scroll.tsx    # Lenis smooth scroll wrapper
│   ├── sections/
│   │   ├── hero.tsx         # Hero section
│   │   ├── stats.tsx        # Statistics section
│   │   ├── about.tsx        # About section
│   │   ├── products.tsx     # Products section
│   │   └── contact.tsx      # Contact section
│   └── ui/                  # shadcn/ui components (65+ components)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ... (60+ more)
├── lib/
│   └── utils.ts             # Utility functions (cn helper)
├── hooks/
│   ├── use-mobile.ts        # Mobile detection hook
│   └── use-toast.ts         # Toast notification hook
├── public/
│   ├── icon.svg             # Main icon
│   ├── icon-light-32x32.png # Light mode icon
│   ├── icon-dark-32x32.png  # Dark mode icon
│   ├── apple-icon.png       # Apple touch icon
│   └── placeholder*.{jpg,svg} # Placeholder images
├── styles/
│   └── globals.css          # Additional global styles (if needed)
├── components.json           # shadcn/ui configuration
├── next.config.mjs          # Next.js configuration
├── postcss.config.mjs       # PostCSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Design System

### Color Palette

The design system uses a steel manufacturing theme with industrial colors:

#### Brand Colors
- **Steel Black**: `#0B0D0E` - Primary background (dark mode)
- **Steel White**: `#F7F7F7` - Primary background (light mode)
- **Steel Gray**: `#2E2E2E` - Secondary text and borders
- **Steel Red**: `#E10600` - Accent color, CTAs, brand identity
- **Steel Dark**: `#111315` - Card backgrounds (dark mode)
- **Steel Muted**: `#6B7280` - Muted text

#### CSS Variables

The application uses CSS custom properties for theming:

**Light Mode Variables:**
```css
--background: #F7F7F7
--foreground: #0B0D0E
--card: #FFFFFF
--primary: #E10600
--secondary: #E5E5E5
--muted: #E5E5E5
--accent: #E10600
--border: #CCCCCC
--ring: #E10600
```

**Dark Mode Variables:**
```css
--background: #0B0D0E
--foreground: #F7F7F7
--card: #111315
--primary: #E10600
--secondary: #1A1D1F
--muted: #1A1D1F
--accent: #E10600
--border: #2E2E2E
--ring: #E10600
```

**Custom Steel Colors (Always Available):**
```css
--steel-black: #0B0D0E
--steel-white: #F7F7F7
--steel-gray: #2E2E2E
--steel-red: #E10600
--steel-dark: #111315
--steel-muted: #6B7280
```

### Typography

#### Font Families
- **Primary (Sans)**: Inter - Clean, modern, professional
- **Monospace**: Geist Mono - Code and technical content

#### Font Scale
- **H1**: `text-5xl md:text-6xl lg:text-7xl` (48px - 72px)
- **H2**: `text-4xl md:text-5xl` (36px - 48px)
- **H3**: `text-2xl md:text-3xl` (24px - 30px)
- **H4**: `text-xl md:text-2xl` (20px - 24px)
- **Body**: Default with `leading-relaxed`

#### Typography Features
- Uppercase tracking for labels: `uppercase tracking-[0.2em]` or `tracking-[0.3em]`
- Font weight: Bold for headings, medium for labels
- Letter spacing: Tight for headings (`tracking-tight`)

### Spacing & Layout

- **Container**: `max-w-7xl` (1280px) for main content
- **Section Padding**: `px-6 py-24` (24px horizontal, 96px vertical)
- **Grid Gaps**: `gap-6`, `gap-8`, `gap-12`, `gap-16`
- **Border Radius**: `0.5rem` (8px) default, with variants

### Component Patterns

#### Buttons
- **Primary CTA**: Red background (`bg-steel-red`), white text, uppercase, tracking-wider
- **Secondary**: Border only, transparent background, hover effects
- **Size**: `px-8 py-4` for large, `px-6 py-2.5` for medium

#### Cards
- Border: `border border-border`
- Background: `bg-card`
- Padding: `p-6` or `p-8`
- Hover effects: Border color change, background transition

#### Forms
- Inputs: `border border-border bg-background`
- Focus: `focus:border-steel-red focus:outline-none`
- Labels: `text-sm font-medium`

## Theme System

### Theme Provider

Custom theme implementation (`components/theme-provider.tsx`):

**Features:**
- Light and dark mode support
- LocalStorage persistence (key: `acero-theme`)
- Default theme: Dark mode
- Prevents flash of unstyled content (FOUC)
- Smooth transitions between themes

**Usage:**
```tsx
import { useTheme } from "@/components/theme-provider"

const { theme, setTheme, toggleTheme } = useTheme()
```

**Implementation Details:**
- Uses React Context API
- Applies `.dark` class to `document.documentElement`
- Handles mounting state to prevent hydration issues
- Stores preference in localStorage

### Theme Toggle

Located in header component:
- Button with sun/moon icon
- Toggles between light and dark modes
- Visual feedback on hover
- Accessible with ARIA labels

## Animation System

### Framer Motion

Used for component animations and transitions:

**Common Patterns:**
```tsx
// Initial animation
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}

// Scroll-triggered animations
const ref = useRef(null)
const isInView = useInView(ref, { once: true, margin: "-100px" })
animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
```

**Animation Delays:**
- Staggered animations: `delay: index * 0.1`
- Sequential reveals: `delay: 0.1, 0.2, 0.3...`

### Lenis Smooth Scroll

Implemented via `components/smooth-scroll.tsx`:

**Configuration:**
- Duration: 1.2s
- Easing: Custom exponential easing
- Orientation: Vertical only
- Smooth wheel: Enabled

**Integration:**
- Wraps entire application in layout
- Uses `requestAnimationFrame` for performance
- Cleans up on unmount

### Custom CSS Animations

Defined in `globals.css`:

**Available Animations:**
- `animate-fade-in`: Fade in with upward motion
- `animate-fade-in-left`: Fade in from left
- `animate-fade-in-right`: Fade in from right

**Animation Delays:**
- `animation-delay-100` through `animation-delay-500`

## Component Architecture

### Page Structure

**Homepage (`app/page.tsx`):**
```tsx
<Header />
<main>
  <HeroSection />
  <StatsSection />
  <AboutSection />
  <ProductsSection />
  <ContactSection />
</main>
<Footer />
```

### Header Component

**Features:**
- Fixed positioning with scroll effects
- Responsive navigation (desktop/mobile)
- Dropdown menus for Products and Media
- Theme toggle button
- "Get Quote" CTA
- Animated mobile menu

**Navigation Links:**
- Who We Are
- Products (dropdown)
- Projects
- Media (dropdown)
- Career
- Contact Us

### Footer Component

**Sections:**
- Brand information and logo
- Contact details (phone, email, address)
- Social media links
- Quick Links
- Products links
- Media links
- Copyright and legal links

### Section Components

#### Hero Section
- Full-screen hero with background pattern
- Animated title and description
- Two CTA buttons
- Scroll indicator animation
- Gradient border at bottom

#### Stats Section
- 4-column grid (responsive: 2 columns on mobile)
- Animated counters on scroll
- Statistics: Years Experience, Projects, Tons Produced, Quality

#### About Section
- Two-column layout (content + features grid)
- 4 feature cards with icons
- Scroll-triggered animations
- "Learn Our Story" link

#### Products Section
- Product cards grid (4 items, responsive)
- Image placeholders
- Category badges
- Hover effects
- "View All Products" CTA

#### Contact Section
- Two-column layout (info + form)
- Contact information cards
- Contact form with validation
- Form fields: Name, Email, Company, Message

## Configuration Files

### Next.js Configuration (`next.config.mjs`)

```javascript
{
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true }
}
```

**Settings:**
- TypeScript errors ignored during build (for development)
- Images unoptimized (may need adjustment for production)

### TypeScript Configuration (`tsconfig.json`)

**Key Settings:**
- Target: ES6
- Module: ESNext
- JSX: Preserve (Next.js handles)
- Path aliases: `@/*` maps to `./*`
- Strict mode: Enabled

### PostCSS Configuration (`postcss.config.mjs`)

```javascript
{
  plugins: {
    '@tailwindcss/postcss': {}
  }
}
```

**Note:** Tailwind CSS v4 uses new PostCSS plugin instead of traditional config file.

### shadcn/ui Configuration (`components.json`)

**Settings:**
- Style: New York
- RSC: true (React Server Components)
- TSX: true
- Base color: neutral
- CSS variables: true
- Icon library: lucide

**Path Aliases:**
- Components: `@/components`
- Utils: `@/lib/utils`
- UI: `@/components/ui`

## Dependencies

### Production Dependencies

**Core:**
- next: 16.0.10
- react: 19.2.0
- react-dom: 19.2.0

**Styling:**
- tailwindcss: 4.1.9
- autoprefixer: 10.4.20
- tailwindcss-animate: 1.0.7
- tw-animate-css: 1.3.3

**Animations:**
- framer-motion: 12.27.0
- lenis: 1.3.17

**UI Components:**
- @radix-ui/*: Multiple packages (accordion, dialog, dropdown, etc.)
- lucide-react: 0.454.0
- class-variance-authority: 0.7.1
- clsx: 2.1.1
- tailwind-merge: 3.3.1

**Forms:**
- react-hook-form: 7.60.0
- @hookform/resolvers: 3.10.0
- zod: 3.25.76

**Utilities:**
- date-fns: 4.1.0
- cmdk: 1.0.4
- sonner: 1.7.4
- @vercel/analytics: 1.3.1

### Development Dependencies

- typescript: 5.x
- @types/node: 22
- @types/react: 19
- @types/react-dom: 19
- @tailwindcss/postcss: 4.1.9
- postcss: 8.5

## Responsive Design

### Breakpoints

Using Tailwind's default breakpoints:
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Approach

- Base styles target mobile
- Progressive enhancement for larger screens
- Navigation collapses to hamburger menu on mobile
- Grid layouts adapt: 1 column → 2 columns → 4 columns

### Responsive Patterns

**Typography:**
- Headings scale: `text-5xl md:text-6xl lg:text-7xl`
- Padding adjusts: `px-6 lg:px-8`

**Layout:**
- Grid columns: `grid-cols-2 md:grid-cols-4`
- Flex direction: `flex-col sm:flex-row`

## Performance Optimizations

### Font Loading
- Google Fonts with `display: swap`
- Font variables for efficient loading
- Preload critical fonts

### Image Optimization
- Next.js Image component (when configured)
- Placeholder images for development
- Lazy loading support

### Code Splitting
- Next.js automatic code splitting
- Component-level lazy loading
- Route-based splitting

### Animation Performance
- GPU-accelerated transforms
- `will-change` for animated elements
- `requestAnimationFrame` for smooth scroll

## Accessibility

### ARIA Labels
- Theme toggle: `aria-label` with current state
- Mobile menu: `aria-label="Toggle menu"`
- Social links: `aria-label` for each platform

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- Navigation landmarks
- Form labels and inputs properly associated

### Keyboard Navigation
- Focus states on interactive elements
- Tab order follows visual flow
- Escape key closes mobile menu

### Color Contrast
- WCAG AA compliant color combinations
- High contrast in both light and dark modes
- Focus indicators visible

## Browser Support

### Modern Browsers
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

### Features Used
- CSS Custom Properties (CSS Variables)
- Flexbox and Grid
- ES6+ JavaScript
- CSS Animations

## Integration Points

### Backend API

The frontend is designed to integrate with the Acero CMS backend:

**Expected Endpoints:**
- `/api/public` - Public content (pages, sections)
- `/api/projects` - Project listings
- `/api/contact` - Contact form submissions (to be implemented)
- `/api/media` - Media assets

**API Configuration:**
- Base URL should be configurable via environment variable
- CORS handled by backend
- Authentication may be required for admin features

### Environment Variables

**Current Status**: No environment variables are required for the frontend to run. The application is currently static and doesn't make API calls.

**For Future Backend Integration:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Create a `.env.local` file in the `frontend` directory when needed. Next.js automatically loads environment variables prefixed with `NEXT_PUBLIC_`.

## Development Workflow

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (npm or pnpm)
npm install
# OR
pnpm install
```

**Note**: The project has `pnpm-lock.yaml`, but `npm install` works perfectly fine and is tested.

### Development Server

```bash
# Start development server with hot reload
npm run dev
# OR
pnpm dev

# Server runs on http://localhost:3000
# Network access available at http://[your-ip]:3000
```

### Build

```bash
# Create optimized production build
npm run build
# OR
pnpm build

# Start production server (after build)
npm run start
# OR
pnpm start
```

### Linting

```bash
# Run ESLint
npm run lint
# OR
pnpm lint
```

### Verification

After installation, verify everything works:

1. **Dependencies installed**: Check that `node_modules` directory exists
2. **Dev server starts**: Run `npm run dev` and verify no errors
3. **Build succeeds**: Run `npm run build` and verify successful compilation
4. **Theme works**: Toggle theme button in header
5. **Smooth scroll**: Scroll page and verify smooth scrolling behavior
6. **Responsive**: Test on different screen sizes

## Known Issues & Considerations

### Current Limitations

1. **Image Assets**: Product images referenced but may not exist in `/public/images/`
   - Product cards use placeholder SVGs
   - Add actual product images to `/public/images/` when available

2. **Contact Form**: Form submission handler needs backend integration
   - Currently logs to console
   - Needs API endpoint integration
   - Add form validation with Zod schema

3. **API Integration**: No API client configured yet
   - Create API service layer
   - Configure fetch/axios client
   - Add error handling

4. **TypeScript**: Build errors ignored in config (should be fixed)
   - `next.config.mjs` has `ignoreBuildErrors: true`
   - Should be removed and actual errors fixed

5. **Unused Dependencies**: Some packages may not be used
   - `@emotion/is-prop-valid`: "latest" version (should pin)
   - `@nuxt/kit`: Nuxt.js package, not needed for Next.js
   - Consider cleaning up unused dependencies

### Future Enhancements

1. **API Client**: Create service layer for backend communication
2. **Image Optimization**: Configure Next.js Image component properly
3. **Error Handling**: Add error boundaries and error states
4. **Loading States**: Add skeleton loaders for async content
5. **SEO**: Enhance metadata and Open Graph tags
6. **Analytics**: Configure Vercel Analytics events
7. **Form Validation**: Add Zod schema validation to contact form

## File Organization Best Practices

### Component Structure
- One component per file
- Co-locate related components
- Use TypeScript for type safety
- Export named exports for components

### Styling Approach
- Utility-first with Tailwind
- CSS variables for theming
- Custom animations in globals.css
- Component-specific styles in component files

### Import Organization
```tsx
// 1. React/Next imports
import React from "react"
import Link from "next/link"

// 2. Third-party libraries
import { motion } from "framer-motion"

// 3. Internal components
import { Header } from "@/components/header"

// 4. Utilities and hooks
import { cn } from "@/lib/utils"

// 5. Types
import type { ComponentProps } from "react"
```

## Testing Considerations

### Component Testing
- Test theme switching
- Test responsive breakpoints
- Test form validation
- Test navigation interactions

### Visual Testing
- Light/dark mode rendering
- Animation states
- Loading states
- Error states

### Integration Testing
- API endpoint connections
- Form submissions
- Navigation flows

## Deployment

### Build Output
- Static export possible (if configured)
- Server-side rendering for dynamic content
- Image optimization for production

### Environment Setup
- Set `NEXT_PUBLIC_API_URL` for production
- Configure analytics
- Set up error tracking (if needed)

### Performance Monitoring
- Vercel Analytics included
- Core Web Vitals tracking
- Real User Monitoring (RUM)

---

## Summary

This frontend is a modern, well-structured Next.js application with:
- ✅ Premium design system with steel manufacturing theme
- ✅ Full dark/light mode support
- ✅ Smooth animations and scroll effects
- ✅ Responsive, mobile-first design
- ✅ Comprehensive UI component library
- ✅ Type-safe TypeScript implementation
- ✅ Performance optimizations
- ✅ Accessibility considerations

The foundation is solid and ready for:
- Backend API integration
- Content management integration
- Additional page routes
- Enhanced features and functionality
