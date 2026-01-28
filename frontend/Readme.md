# Acero Website Frontend

Modern, high-performance Next.js frontend for the Acero Steel Manufacturing website.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.x or higher (v22.15.1 tested)
- **npm**: 10.x or higher (or pnpm if preferred)
- **Package Manager**: npm (pnpm-lock.yaml present, but npm works fine)

### Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
   Or if you have pnpm installed:
   ```bash
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The application will be available at [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create optimized production build
- `npm run start` - Start production server (after build)
- `npm run lint` - Run ESLint to check code quality

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles and theme variables
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── header.tsx        # Navigation header
│   ├── footer.tsx        # Footer component
│   ├── theme-provider.tsx # Theme context provider
│   ├── smooth-scroll.tsx # Lenis smooth scroll wrapper
│   ├── sections/         # Page sections
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
└── public/                # Static assets
```

## 🎨 Features

- ✅ **Dark/Light Mode** - Full theme switching with persistence
- ✅ **Smooth Scrolling** - Lenis-powered smooth scroll animations
- ✅ **Animations** - Framer Motion for component animations
- ✅ **Responsive Design** - Mobile-first, fully responsive
- ✅ **TypeScript** - Full type safety
- ✅ **Modern UI** - shadcn/ui component library
- ✅ **Performance** - Optimized for speed and SEO

## 🛠️ Technology Stack

- **Framework**: Next.js 16.0.10 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9
- **Animations**: Framer Motion 12.27.0, Lenis 1.3.17
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React

## 📦 Dependencies

All dependencies are listed in `package.json`. Key dependencies include:

- Next.js, React, TypeScript
- Tailwind CSS, PostCSS
- Framer Motion, Lenis
- Radix UI components
- React Hook Form, Zod

## ⚙️ Configuration

### Environment Variables

Currently, no environment variables are required for the frontend to run. For future backend integration, you may need:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Create a `.env.local` file in the `frontend` directory if needed.

### TypeScript Configuration

The `tsconfig.json` is automatically configured by Next.js. Key settings:
- Path aliases: `@/*` maps to `./*`
- Strict mode enabled
- React JSX runtime

### Tailwind CSS

Tailwind CSS v4 is configured via PostCSS. The configuration is in `postcss.config.mjs`. Theme variables are defined in `app/globals.css`.

## 🐛 Troubleshooting

### Issue: Dependencies not installing

**Solution**: 
- Ensure Node.js 18+ is installed
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- If using pnpm, ensure it's installed: `npm install -g pnpm`

### Issue: Build errors

**Solution**:
- Check TypeScript errors: `npm run build` (errors are currently ignored in config)
- Ensure all dependencies are installed
- Clear Next.js cache: `rm -rf .next` (or delete `.next` folder on Windows)

### Issue: Styles not loading

**Solution**:
- Ensure Tailwind CSS is properly configured in `postcss.config.mjs`
- Check that `app/globals.css` is imported in `app/layout.tsx`
- Verify Tailwind v4 PostCSS plugin is installed

### Issue: Theme not switching

**Solution**:
- Check browser console for errors
- Verify `ThemeProvider` wraps the app in `app/layout.tsx`
- Check localStorage for `acero-theme` key

### Issue: Smooth scroll not working

**Solution**:
- Verify `SmoothScroll` component wraps content in layout
- Check browser console for Lenis errors
- Ensure Lenis is installed: `npm list lenis`

## 🔗 Backend Integration

The frontend is designed to integrate with the Acero CMS backend API. Currently, the contact form logs to console. To integrate:

1. Create an API client service
2. Configure `NEXT_PUBLIC_API_URL` environment variable
3. Update form submission handlers
4. Add error handling and loading states

## 📝 Development Notes

### Adding New Pages

1. Create a new file in `app/` directory (e.g., `app/about/page.tsx`)
2. Export a default React component
3. The route will be available at `/about`

### Adding New Components

1. Create component file in `components/` directory
2. Use TypeScript for type safety
3. Follow existing component patterns
4. Use Tailwind CSS for styling

### Theme Customization

Theme colors are defined in `app/globals.css` as CSS variables. Modify the `:root` and `.dark` selectors to change colors.

### Animation Patterns

Use Framer Motion for animations:
```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Deploy to Vercel

The project is configured for Vercel deployment:

1. Push code to GitHub
2. Import project in Vercel
3. Vercel will auto-detect Next.js and configure build settings
4. Set environment variables if needed

## 📚 Documentation

For detailed design system documentation, see [frontendDesign.md](./frontendDesign.md).

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new files
3. Follow component patterns in `components/` directory
4. Test in both light and dark modes
5. Ensure responsive design works on mobile

## 📄 License

Private project for Acero Steel Manufacturing.

---

**Status**: ✅ Ready for development and backend integration
