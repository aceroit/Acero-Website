"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
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
import { filterOptions } from "@/utils/projects-data"

interface ProjectFiltersProps {
  hideIndustry?: boolean
  className?: string
}

export function ProjectFilters({ hideIndustry = false, className }: ProjectFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const industry = searchParams.get("industry") || "all"
  const area = searchParams.get("area") || "all"
  const region = searchParams.get("region") || "all"
  const country = searchParams.get("country") || "all"

  const hasActiveFilters = !!(
    (industry && industry !== "all") ||
    (area && area !== "all") ||
    (region && region !== "all") ||
    (country && country !== "all")
  )

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
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
        <Select value={industry} onValueChange={(value) => updateFilter("industry", value)}>
          <SelectTrigger className="h-12 w-[220px] text-base font-medium">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {filterOptions.industries.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={area} onValueChange={(value) => updateFilter("area", value)}>
        <SelectTrigger className="h-12 w-[220px] text-base font-medium">
          <SelectValue placeholder="All Areas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Areas</SelectItem>
          {filterOptions.areas.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={region} onValueChange={(value) => updateFilter("region", value)}>
        <SelectTrigger className="h-12 w-[220px] text-base font-medium">
          <SelectValue placeholder="All Regions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {filterOptions.regions.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={country} onValueChange={(value) => updateFilter("country", value)}>
        <SelectTrigger className="h-12 w-[220px] text-base font-medium">
          <SelectValue placeholder="All Countries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {filterOptions.countries.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
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

