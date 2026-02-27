/**
 * Spacing Utilities
 * Provides utilities to get spacing values from website appearance configuration
 */

import type { WebsiteAppearance } from '@/lib/api/types'

export interface SpacingValues {
  containerMaxWidth: string
  sectionPadding: string
  gridGap: string
}

const DEFAULT_SPACING: SpacingValues = {
  containerMaxWidth: 'max-w-7xl',
  sectionPadding: 'px-6 py-16 lg:py-24',
  gridGap: 'gap-8',
}

/**
 * Ensure sectionPadding uses py-16 on mobile (<lg) regardless of CMS value.
 * Transforms e.g. "px-6 py-24" → "px-6 py-16 lg:py-24"
 */
function ensureMobilePadding(padding: string): string {
  if (padding.includes('lg:py-')) return padding
  return padding.replace(/py-(\d+)/, 'py-16 lg:py-$1')
}

/**
 * Get spacing values from website appearance configuration
 * Returns default values if appearance is not available or fields are inactive
 */
export function getSpacingValues(appearance: WebsiteAppearance | null): SpacingValues {
  if (!appearance?.spacing) {
    return DEFAULT_SPACING
  }

  const { spacing } = appearance

  const rawPadding =
    spacing.sectionPadding?.isFieldActive && spacing.sectionPadding.value
      ? spacing.sectionPadding.value
      : DEFAULT_SPACING.sectionPadding

  return {
    containerMaxWidth:
      spacing.containerMaxWidth?.isFieldActive && spacing.containerMaxWidth.value
        ? spacing.containerMaxWidth.value
        : DEFAULT_SPACING.containerMaxWidth,
    sectionPadding: ensureMobilePadding(rawPadding),
    gridGap:
      spacing.gridGap?.isFieldActive && spacing.gridGap.value
        ? spacing.gridGap.value
        : DEFAULT_SPACING.gridGap,
  }
}

/**
 * Hook to get spacing values from appearance
 * This is a convenience wrapper that can be used in components
 */
export function useSpacing(appearance: WebsiteAppearance | null): SpacingValues {
  return getSpacingValues(appearance)
}
