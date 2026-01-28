/**
 * API endpoint constants
 * These are relative paths that will be combined with the base URL
 */

export const API_ENDPOINTS = {
  PUBLIC_HEADER_CONFIG: '/api/public/header-configuration',
  PUBLIC_FOOTER_CONFIG: '/api/public/footer-configuration',
  PUBLIC_APPEARANCE_CONFIG: '/api/public/website-appearance',
  PUBLIC_PAGE_BY_SLUG: '/api/public/pages/slug', // Will append /:slug
  PUBLIC_PAGE_BY_PATH: '/api/public/pages/by-path',
  PUBLIC_INDUSTRIES: '/api/public/industries',
  PUBLIC_BUILDING_TYPES: '/api/public/building-types',
  PUBLIC_PROJECTS: '/api/public/projects',
  PUBLIC_PROJECTS_HOME: '/api/public/projects/home',
  PUBLIC_FILTER_OPTIONS: '/api/public/filter-options',
  PUBLIC_BRANCHES: '/api/public/branches',
  PUBLIC_COMPANY_UPDATES_HOME: '/api/public/company-updates/home',
  PUBLIC_FORM_CONFIGURATION: '/api/public/form-configuration',
} as const

