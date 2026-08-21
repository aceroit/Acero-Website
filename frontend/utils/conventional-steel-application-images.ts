/**
 * Maps Conventional Steel application names (from backend) to local image filenames
 * in public/images/conventional-steel-applications/.
 *
 * The old folder name contained spaces and a typo ("Conventional Stell Application"),
 * which made deployment easy to break on Linux servers. These safe lowercase paths
 * are stable for both local Next.js and Hostinger builds.
 */

const CS_APPLICATION_IMAGE_BASE = '/images/conventional-steel-applications'

const APPLICATION_NAME_TO_FILENAME: Record<string, string> = {
  'Pipe Racks': 'pipe-racks.png',
  'Equipment': 'equipment.png',
  'Desalination Plant': 'desalination-plant.png',
  'Petrochemical Plant': 'petrochemical-plant.png',
  'Steel Mill': 'steel-mill.png',
  'Bridge Structure': 'bridge-structure.png',
  'Cement Plant': 'cement-plant.png',
  'Oil and Gas': 'oil-and-gas.png',
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
  return `${CS_APPLICATION_IMAGE_BASE}/${filename}`
}
