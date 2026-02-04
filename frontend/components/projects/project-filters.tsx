"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect } from "react"
import { CustomSelect } from "@/components/ui/custom-select"
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

  // Prepare options for CustomSelect
  const industryOptions = [
    { value: "all", label: "All Industries" },
    ...(isLoading 
      ? [{ value: "loading", label: "Loading...", isDisabled: true }]
      : filterOptions.industries.map((ind) => ({ value: ind.slug, label: ind.name }))
    )
  ]

  const areaOptions = [
    { value: "all", label: "All Areas" },
    ...(isLoading
      ? [{ value: "loading", label: "Loading...", isDisabled: true }]
      : filterOptions.areas.map((a) => ({ value: a.code, label: a.name }))
    )
  ]

  const regionOptions = [
    { value: "all", label: "All Regions" },
    ...(isLoading
      ? [{ value: "loading", label: "Loading...", isDisabled: true }]
      : filterOptions.regions.map((r) => ({ value: r.code, label: r.name }))
    )
  ]

  const countryOptions = [
    { value: "all", label: "All Countries" },
    ...(isLoading
      ? [{ value: "loading", label: "Loading...", isDisabled: true }]
      : filterOptions.countries.map((c) => ({ value: c.code, label: c.name }))
    )
  ]

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-6", className)}>
      {!hideIndustry && (
        <CustomSelect
          value={currentIndustryValue}
          onValueChange={(value) => updateFilter("industry", value)}
          options={industryOptions}
          placeholder="All Industries"
          className="h-12 w-[220px] text-base font-medium"
        />
      )}

      <CustomSelect
        value={area}
        onValueChange={(value) => updateFilter("area", value)}
        options={areaOptions}
        placeholder="All Areas"
        className="h-12 w-[220px] text-base font-medium"
      />

      <CustomSelect
        value={region}
        onValueChange={(value) => updateFilter("region", value)}
        options={regionOptions}
        placeholder="All Regions"
        className="h-12 w-[220px] text-base font-medium"
      />

      <CustomSelect
        value={country}
        onValueChange={(value) => updateFilter("country", value)}
        options={countryOptions}
        placeholder="All Countries"
        className="h-12 w-[220px] text-base font-medium"
      />

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

