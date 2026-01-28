"use client"

import { useEffect } from 'react'
import { useAppearance } from '@/hooks/use-appearance'
import { useTheme } from '@/components/theme-provider'
import type { WebsiteAppearance } from '@/lib/api/types'

interface AppearanceProviderProps {
  children: React.ReactNode
}

/**
 * AppearanceProvider
 * Applies website appearance configuration to CSS variables dynamically
 */
export function AppearanceProvider({ children }: AppearanceProviderProps) {
  const { appearance, isLoading } = useAppearance()
  const { theme } = useTheme()

  useEffect(() => {
    if (isLoading || !appearance) {
      return
    }

    const root = document.documentElement
    const isDark = theme === 'dark'

    // Create or get style elements
    let lightStyleEl = document.getElementById('appearance-light-mode-styles')
    if (!lightStyleEl) {
      lightStyleEl = document.createElement('style')
      lightStyleEl.id = 'appearance-light-mode-styles'
      document.head.appendChild(lightStyleEl)
    }

    let darkStyleEl = document.getElementById('appearance-dark-mode-styles')
    if (!darkStyleEl) {
      darkStyleEl = document.createElement('style')
      darkStyleEl.id = 'appearance-dark-mode-styles'
      document.head.appendChild(darkStyleEl)
    }

    // Apply color palette - Light Mode (only when not in dark mode)
    if (appearance.colorPalette.lightMode) {
      const lightMode = appearance.colorPalette.lightMode
      
      let lightStyles = ':root:not(.dark) {'
      if (lightMode.background.isFieldActive) {
        lightStyles += `--background: ${lightMode.background.value} !important; `
      }
      if (lightMode.foreground.isFieldActive) {
        lightStyles += `--foreground: ${lightMode.foreground.value} !important; `
        lightStyles += `--card-foreground: ${lightMode.foreground.value} !important; `
        lightStyles += `--popover-foreground: ${lightMode.foreground.value} !important; `
        lightStyles += `--secondary-foreground: ${lightMode.foreground.value} !important; `
      }
      if (lightMode.card.isFieldActive) {
        lightStyles += `--card: ${lightMode.card.value} !important; `
        lightStyles += `--popover: ${lightMode.card.value} !important; `
      }
      if (lightMode.primary.isFieldActive) {
        lightStyles += `--primary: ${lightMode.primary.value} !important; `
      }
      if (lightMode.secondary.isFieldActive) {
        lightStyles += `--secondary: ${lightMode.secondary.value} !important; `
        lightStyles += `--input: ${lightMode.secondary.value} !important; `
      }
      if (lightMode.muted.isFieldActive) {
        lightStyles += `--muted: ${lightMode.muted.value} !important; `
      }
      if (lightMode.accent.isFieldActive) {
        lightStyles += `--accent: ${lightMode.accent.value} !important; `
      }
      if (lightMode.border.isFieldActive) {
        lightStyles += `--border: ${lightMode.border.value} !important; `
      }
      if (lightMode.ring.isFieldActive) {
        lightStyles += `--ring: ${lightMode.ring.value} !important; `
      }
      lightStyles += '}'
      
      lightStyleEl.textContent = lightStyles
    }

    // Apply color palette - Dark Mode
    if (appearance.colorPalette.darkMode) {
      const darkMode = appearance.colorPalette.darkMode
      
      let darkStyles = ':root.dark, .dark {'
      if (darkMode.background.isFieldActive) {
        darkStyles += `--background: ${darkMode.background.value} !important; `
      }
      if (darkMode.foreground.isFieldActive) {
        darkStyles += `--foreground: ${darkMode.foreground.value} !important; `
        darkStyles += `--card-foreground: ${darkMode.foreground.value} !important; `
        darkStyles += `--popover-foreground: ${darkMode.foreground.value} !important; `
        darkStyles += `--secondary-foreground: ${darkMode.foreground.value} !important; `
      }
      if (darkMode.card.isFieldActive) {
        darkStyles += `--card: ${darkMode.card.value} !important; `
        darkStyles += `--popover: ${darkMode.card.value} !important; `
      }
      if (darkMode.primary.isFieldActive) {
        darkStyles += `--primary: ${darkMode.primary.value} !important; `
      }
      if (darkMode.secondary.isFieldActive) {
        darkStyles += `--secondary: ${darkMode.secondary.value} !important; `
        darkStyles += `--input: ${darkMode.secondary.value} !important; `
      }
      if (darkMode.muted.isFieldActive) {
        darkStyles += `--muted: ${darkMode.muted.value} !important; `
      }
      if (darkMode.accent.isFieldActive) {
        darkStyles += `--accent: ${darkMode.accent.value} !important; `
      }
      if (darkMode.border.isFieldActive) {
        darkStyles += `--border: ${darkMode.border.value} !important; `
      }
      if (darkMode.ring.isFieldActive) {
        darkStyles += `--ring: ${darkMode.ring.value} !important; `
      }
      darkStyles += '}'
      
      darkStyleEl.textContent = darkStyles
    }

    // Apply steel colors
    if (appearance.colorPalette.steelColors) {
      const steel = appearance.colorPalette.steelColors
      
      if (steel.steelBlack.isFieldActive) {
        root.style.setProperty('--steel-black', steel.steelBlack.value)
      }
      if (steel.steelWhite.isFieldActive) {
        root.style.setProperty('--steel-white', steel.steelWhite.value)
      }
      if (steel.steelGray.isFieldActive) {
        root.style.setProperty('--steel-gray', steel.steelGray.value)
      }
      if (steel.steelRed.isFieldActive) {
        root.style.setProperty('--steel-red', steel.steelRed.value)
      }
      if (steel.steelDark.isFieldActive) {
        root.style.setProperty('--steel-dark', steel.steelDark.value)
      }
      if (steel.steelMuted.isFieldActive) {
        root.style.setProperty('--steel-muted', steel.steelMuted.value)
      }
    }

    // Apply border radius
    if (appearance.borderRadius?.defaultRadius.isFieldActive) {
      root.style.setProperty('--radius', appearance.borderRadius.defaultRadius.value)
    }

    // Note: Typography and spacing are typically handled via Tailwind classes
    // and would require more complex implementation. For now, we focus on colors
    // which are the most impactful for appearance customization.

  }, [appearance, isLoading, theme])

  return <>{children}</>
}

