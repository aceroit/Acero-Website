/**
 * Maps advantage/icon names (from backend) to image paths in public/portaCabin/.
 * Used by advantages_grid section on Porta Cabins page to show PNG images instead of Lucide icons.
 * Matches by advantage title or icon field (case-insensitive, trimmed).
 */

const PORTA_CABIN_BASE = "/portaCabin"

/** Normalized key (lowercase) -> filename in portaCabin folder */
const NORMALIZED_TO_FILENAME: Record<string, string> = {
  "cost saving": "Cost Saving.png",
  "flexibility": "Flexibility.png",
  "portability": "Portability.png",
  "time saving": "Time Saving.png",
}

/**
 * Get public URL for Porta Cabin advantage image by icon or advantage title.
 * Returns null if no matching image exists.
 * Tries exact match first, then case-insensitive normalized match.
 */
export function getPortaCabinImagePath(name: string | undefined | null): string | null {
  const trimmed = name?.trim()
  if (!trimmed) return null
  const normalized = trimmed.toLowerCase()
  const filename = NORMALIZED_TO_FILENAME[normalized]
  if (!filename) return null
  return `${PORTA_CABIN_BASE}/${encodeURIComponent(filename)}`
}
