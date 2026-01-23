/**
 * Icon Mapper Utility
 * Maps icon name strings to Lucide React icon components
 */

import {
  Globe,
  Factory,
  Code,
  Award,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Truck,
  Settings,
  Zap,
  Shield,
  Leaf,
  CheckCircle,
  Layers,
  Lightbulb,
  Grid,
  Plane,
  Warehouse,
  Building2,
  Building,
  Droplets,
  Home,
  Palette,
  Briefcase,
  Wheat,
  PlaneTakeoff,
  Package,
  ShoppingBag,
  Store,
  Hammer,
  Cross,
  Snowflake,
  Wrench,
  Cog,
  Trophy,
  Droplet,
  type LucideIcon,
} from 'lucide-react'

/**
 * Icon name to component mapping
 */
const iconMap: Record<string, LucideIcon> = {
  globe: Globe,
  factory: Factory,
  code: Code,
  award: Award,
  users: Users,
  trendingup: TrendingUp,
  dollarsign: DollarSign,
  clock: Clock,
  truck: Truck,
  settings: Settings,
  zap: Zap,
  shield: Shield,
  leaf: Leaf,
  checkcircle: CheckCircle,
  layers: Layers,
  lightbulb: Lightbulb,
  grid: Grid,
  plane: Plane,
  warehouse: Warehouse,
  building2: Building2,
  building: Building,
  droplets: Droplets,
  home: Home,
  palette: Palette,
  briefcase: Briefcase,
  wheat: Wheat,
  planetakeoff: PlaneTakeoff,
  package: Package,
  shoppingbag: ShoppingBag,
  store: Store,
  hammer: Hammer,
  cross: Cross,
  snowflake: Snowflake,
  wrench: Wrench,
  cog: Cog,
  trophy: Trophy,
  droplet: Droplet,
}

/**
 * Get icon component from icon name string
 * @param iconName - Icon name (case-insensitive)
 * @param className - Optional className for the icon
 * @returns React component or null if icon not found
 */
export function getIconComponent(
  iconName: string | undefined | null,
  className: string = 'h-8 w-8'
): React.ReactNode | null {
  if (!iconName) {
    return null
  }

  // Normalize icon name (lowercase, remove spaces)
  const normalizedName = iconName.toLowerCase().trim()

  const IconComponent = iconMap[normalizedName]

  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in icon map`)
    return null
  }

  return <IconComponent className={className} />
}

