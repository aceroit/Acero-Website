"use client"

import { cn } from "@/lib/utils"
import { InlineAnimatedSvg } from "@/components/sections/inline-animated-svg"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import { useMemo } from "react"

const DESKTOP_SVG = "/svgs/peb-advantage.svg"
const MOBILE_SVG = "/svgs/peb-advantage-sm.svg"

/**
 * Advantages of PEB section: title + desktop/mobile SVGs.
 * Uses InlineAnimatedSvg so in-SVG hover (showLayer/hideLayer) and CSS :hover work.
 * Takes full container width aligned with header size as per frontendDesign.md.
 */
export function PebAdvantageSvgSection({ className }: { className?: string }) {
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])

  return (
    <section
      className={cn(
        "border-t border-border bg-background",
        spacing.sectionPadding,
        className
      )}
    >
      {/* Container aligned with header - uses spacing.containerMaxWidth for consistency */}
      <div
        className={cn(
          "mx-auto flex flex-col items-center justify-center",
          spacing.containerMaxWidth,
          spacing.gridGap,
          "px-6 lg:px-8"
        )}
      >
        <h2 className="text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Advantages of PEB
        </h2>
        {/* Desktop: inline SVG takes full available width within container */}
        <div className="hidden w-full lg:flex lg:justify-center">
          <InlineAnimatedSvg
            src={DESKTOP_SVG}
            alt="Advantages of PEB"
            className="w-full aspect-[1320/580] min-h-0 [&_svg]:mx-auto [&_svg]:w-full [&_svg]:h-auto"
          />
        </div>
        {/* Mobile: full width */}
        <div className="flex w-full justify-center lg:hidden">
          <InlineAnimatedSvg
            src={MOBILE_SVG}
            alt="Advantages of PEB"
            className="w-full max-w-full min-h-0 [&_svg]:mx-auto [&_svg]:w-full [&_svg]:h-auto"
          />
        </div>
      </div>
    </section>
  )
}
