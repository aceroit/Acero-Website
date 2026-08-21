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
  'pipe racks': 'pipe-racks.png',
  'pipe rack': 'pipe-racks.png',
  equipment: 'equipment.png',
  'desalination plant': 'desalination-plant.png',
  'desaliation plant': 'desalination-plant.png',
  'petrochemical plant': 'petrochemical-plant.png',
  petrochemical: 'petrochemical-plant.png',
  'steel mill': 'steel-mill.png',
  'bridge structure': 'bridge-structure.png',
  'cement plant': 'cement-plant.png',
  'oil and gas': 'oil-and-gas.png',
  'oil gas': 'oil-and-gas.png',
}

function normalizeApplicationName(applicationName: string): string {
  return applicationName
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get public URL for Conventional Steel application image by application name.
 * Returns null if no matching image exists.
 */
export function getConventionalSteelApplicationImagePath(applicationName: string): string | null {
  const normalizedName = normalizeApplicationName(applicationName || '')
  if (!normalizedName) return null
  const filename = APPLICATION_NAME_TO_FILENAME[normalizedName]
  if (!filename) return null
  return `${CS_APPLICATION_IMAGE_BASE}/${filename}`
}
