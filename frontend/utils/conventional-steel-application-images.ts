/**
 * Maps Conventional Steel application names (from backend) to local image filenames
 * in public/Conventional Stell Application/
 */

const CS_APPLICATION_IMAGE_BASE = `/${encodeURIComponent('Conventional Stell Application')}`

const APPLICATION_NAME_TO_FILENAME: Record<string, string> = {
  'Pipe Racks': 'Pipe Racks - Copy.png',
  'Equipment': 'Equipment - Copy.png',
  'Desalination Plant': 'Desalination Plant - Copy.png',
  'Petrochemical Plant': 'Petrochemical plant - Copy.png',
  'Steel Mill': 'Steel Mill - Copy.png',
  'Bridge Structure': 'Bridge Strucutre - Copy.png',
  'Cement Plant': 'Cement Plant - Copy.png',
  'Oil and Gas': 'Oil and Gas - Copy.png',
}

/**
 * Get public URL for Conventional Steel application image by application name.
 * Returns null if no matching image exists.
 */
export function getConventionalSteelApplicationImagePath(applicationName: string): string | null {
  const trimmed = applicationName?.trim()
  if (!trimmed) return null
  const filename = APPLICATION_NAME_TO_FILENAME[trimmed]
  if (!filename) return null
  return `${CS_APPLICATION_IMAGE_BASE}/${encodeURIComponent(filename)}`
}
