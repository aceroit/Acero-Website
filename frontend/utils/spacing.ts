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
  sectionPadding: 'py-16 lg:py-24',
  gridGap: 'gap-8',
}

/**
 * Normalize sectionPadding from CMS:
 * 1. Strip horizontal padding (px-*) -- inner containers handle it to match header alignment
 * 2. Ensure py-16 on mobile, desktop py value preserved via lg: prefix
 */
function normalizeSectionPadding(padding: string): string {
  let result = padding.replace(/\bpx-\d+\b/g, '').trim()
  if (result.includes('lg:py-')) return result
  result = result.replace(/py-(\d+)/, 'py-16 lg:py-$1')
  return result
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
    sectionPadding: normalizeSectionPadding(rawPadding),
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
