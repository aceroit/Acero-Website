"use client"

import { cn } from "@/lib/utils"
import { InlineAnimatedSvg } from "@/components/sections/inline-animated-svg"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import { useMemo } from "react"

const DESKTOP_SVG = "/svgs/why-acero-desktop.svg"
const MOBILE_SVG = "/svgs/why-acero-mobile.svg"

/**
 * Why Acero section: shows the Why Acero animated SVG.
 * Desktop (lg+) shows why-acero-desktop.svg; mobile shows why-acero-mobile.svg.
 * Replaces the info cards (circular_advantages) when used for "Why Acero".
 */
export function WhyAceroSvgSection({ className }: { className?: string }) {
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
      <div
        className={cn(
          "mx-auto flex flex-col items-center justify-center",
          spacing.containerMaxWidth,
          spacing.gridGap,
          "px-6 lg:px-8"
        )}
      >
        <h2 className="text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Why Acero?
        </h2>
        {/* Desktop: why-acero-desktop.svg (hidden on mobile) */}
        <div className="hidden w-full lg:flex lg:justify-center">
          <InlineAnimatedSvg
            src={DESKTOP_SVG}
            alt="Why Acero"
            className="w-full max-w-5xl aspect-[1320/580] min-h-0 [&_svg]:mx-auto"
          />
        </div>
        {/* Mobile: why-acero-mobile.svg (hidden on desktop) */}
        <div className="flex w-full justify-center lg:hidden">
          <InlineAnimatedSvg
            src={MOBILE_SVG}
            alt="Why Acero"
            className="w-full max-w-full min-h-0 [&_svg]:mx-auto"
          />
        </div>
      </div>
    </section>
  )
}
