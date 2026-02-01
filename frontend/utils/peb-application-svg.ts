/**
 * Maps PEB application names (from backend) to local SVG filenames in public/Application of  PEB/
 * Used by application_cards section on PEB page to show SVGs instead of Lucide icons.
 */

const PEB_APPLICATION_SVG_BASE = `/${encodeURIComponent('Application of  PEB')}`

/** Application name (backend) -> SVG filename in "Application of  PEB" folder */
const APPLICATION_NAME_TO_FILENAME: Record<string, string> = {
  'Aircraft Hangar': '1.1_Aircraft Hangar.svg',
  'Distribution Center': '1.2_Distribution Center.svg',
  'Multi Story': '1.3_Multistory.svg',
  'Refinery System': '1.4_Refinery.svg',
  'Steel Platform': '1.5 Steel Platform.svg',
  'Accommodation Camp': '2.1_Accomodation Camp.svg',
  'Exhibition Hall': '2.2_Exhibition Hall.svg',
  'Office Building': '2.3_Office Building.svg',
  'Residential Building': '2.4_Residental Building.svg',
  'Sugar Mill': '2.5_Sugar Mill.svg',
  'Airport Structure': '3.1_Airport Structures.svg',
  'Factory Building': '3.2_Factory Building.svg',
  'Pipe Rack': '3.3_Pipe Rack.svg',
  'Shopping Center': '3.4_Shoping Center.svg',
  'Supermarket': '3.5_Supermarket.svg',
  'Bridge Structure': '4.1_Bridge Structure.svg',
  'Field Hospital': '4.2_Field Hospital.svg',
  'Power Plant': '4.3_Power Plant.svg',
  'Showroom': '4.4_Showroom.svg',
  'Warehouse': '4.5_Warehouse.svg',
  'Cold Storage': '5.1_Cold Storage.svg',
  'Flour Mill': '5.2_Flour Mill.svg',
  'Processing Mill': '5.3_Processing Mill.svg',
  'Sports Center': '5.4_Sports Center.svg',
  'Water Tower': '5.5_Water Tower.svg',
  'Desalination Plant': '6.1_Desaliation Plant.svg',
  'Modular House': '6.2_Modular House.svg',
  'Racking System': '6.3_Racking System.svg',
  'Steel Mill': '6.4_Steel Mill.svg',
  'Workshop': '6.5_Workshop.svg',
}

/**
 * Get public URL for PEB application SVG by application name.
 * Returns null if no matching SVG exists.
 */
export function getPebApplicationSvgPath(applicationName: string): string | null {
  const trimmed = applicationName?.trim()
  if (!trimmed) return null
  const filename = APPLICATION_NAME_TO_FILENAME[trimmed]
  if (!filename) return null
  return `${PEB_APPLICATION_SVG_BASE}/${encodeURIComponent(filename)}`
}
