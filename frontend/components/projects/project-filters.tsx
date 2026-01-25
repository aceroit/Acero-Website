"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFilterOptions } from "@/hooks/use-projects"

interface ProjectFiltersProps {
  hideIndustry?: boolean
  industrySlug?: string // Pass industry slug from URL when on industry page
  className?: string
}

export function ProjectFilters({ hideIndustry = false, industrySlug, className }: ProjectFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use industrySlug from props (when on industry page) or from query params
  const industryParam = searchParams.get("industry") || "all"
  const industry = industrySlug || (industryParam !== "all" ? industryParam : undefined)
  const area = searchParams.get("area") || "all"
  const region = searchParams.get("region") || "all"
  const country = searchParams.get("country") || "all"

  // Get dynamic filter options based on current selections
  // When on industry page, always filter by that industry
  const { filterOptions, isLoading } = useFilterOptions({
    industry: industry,
    country: country !== "all" ? country : undefined,
    region: region !== "all" ? region : undefined,
    area: area !== "all" ? area : undefined,
  })

  // Get current industry value for display (use industrySlug from props if on industry page)
  const currentIndustryValue = industrySlug || (industryParam !== "all" ? industryParam : "all")

  const hasActiveFilters = !!(
    (currentIndustryValue && currentIndustryValue !== "all") ||
    (area && area !== "all") ||
    (region && region !== "all") ||
    (country && country !== "all")
  )

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      
      // Clear dependent filters when parent filter changes
      if (key === "country") {
        params.delete("region")
        params.delete("area")
      } else if (key === "region") {
        params.delete("area")
      } else if (key === "industry") {
        // Industry change doesn't require clearing location filters
      }
      
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const clearFilters = useCallback(() => {
    router.push("?", { scroll: false })
  }, [router])

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-6", className)}>
      {!hideIndustry && (
        <Select value={currentIndustryValue} onValueChange={(value) => updateFilter("industry", value)}>
          <SelectTrigger className="h-12 w-[220px] text-base font-medium">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {isLoading ? (
              <SelectItem value="loading" disabled>Loading...</SelectItem>
            ) : (
              filterOptions.industries.map((ind) => (
                <SelectItem key={ind.slug} value={ind.slug}>
                  {ind.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      <Select value={area} onValueChange={(value) => updateFilter("area", value)}>
        <SelectTrigger className="h-12 w-[220px] text-base font-medium">
          <SelectValue placeholder="All Areas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Areas</SelectItem>
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : (
            filterOptions.areas.map((a) => (
              <SelectItem key={a.code} value={a.code}>
                {a.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Select value={region} onValueChange={(value) => updateFilter("region", value)}>
        <SelectTrigger className="h-12 w-[220px] text-base font-medium">
          <SelectValue placeholder="All Regions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : (
            filterOptions.regions.map((r) => (
              <SelectItem key={r.code} value={r.code}>
                {r.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Select value={country} onValueChange={(value) => updateFilter("country", value)}>
        <SelectTrigger className="h-12 w-[220px] text-base font-medium">
          <SelectValue placeholder="All Countries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : (
            filterOptions.countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="lg"
          onClick={clearFilters}
          className="h-12 gap-2 border-border px-6 text-base font-medium hover:bg-secondary hover:border-steel-red/50"
        >
          <X className="h-5 w-5" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}

