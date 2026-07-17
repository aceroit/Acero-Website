"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PebAdvantageItem = {
  id: string
  title: string
  description: string
  image: string
}

const PEB_ADVANTAGE_ITEMS: PebAdvantageItem[] = [
  {
    id: "speed-of-construction",
    title: "Speed of Construction",
    image: "/images/peb-advantages/speed-of-construction.png",
    description:
      "PEB's are known for their rapid construction. All components are pre-designed and manufactured off-site, no cutting or welding of steel is required on-site and all connections are bolted leading to quick and efficient on-site assembly. This speed of construction significantly reduces project timelines compared to traditional building methods.",
  },
  {
    id: "cost-effectiveness",
    title: "Cost-Effectiveness",
    image: "/images/peb-advantages/cost-effectiveness.png",
    description:
      "PEB's are cost-effective, leveraging optimized designs, standardized raw materials, and efficient connections. With the use of automated machinery and advanced value engineering techniques, PEB's ensure high-quality production while reducing unnecessary expenses. Additionally, minimized material waste contributes to both cost savings and sustainability.",
  },
  {
    id: "versatility",
    title: "Versatility",
    image: "/images/peb-advantages/versatility.png",
    description:
      "PEB's are versatile and suitable for various applications, including warehouses, industrial buildings, commercial spaces, and more. Their adaptability makes them a practical choice for a wide range of construction projects.",
  },
  {
    id: "seismic-resistance",
    title: "Seismic Resistance",
    image: "/images/peb-advantages/seismic-resistance.png",
    description:
      "PEB's are designed to withstand seismic activities. This is crucial in regions prone to seismic activity, providing needed safety and stability.",
  },
  {
    id: "customization",
    title: "Customization",
    image: "/images/peb-advantages/customization.png",
    description:
      "PEB's provide a high level of customization. The flexibility in design allows for tailoring the building components to meet specific project requirements. Customers can have structures designed to suit their unique needs and preferences.",
  },
  {
    id: "sustainability",
    title: "Sustainability",
    image: "/images/peb-advantages/sustainability.png",
    description:
      "PEB's are environmentally friendly as they leverage the recyclability of steel and optimize material usage to minimize waste and lower the carbon footprint.",
  },
  {
    id: "energy-efficiency",
    title: "Energy Efficiency",
    image: "/images/peb-advantages/energy-efficiency.png",
    description:
      "We are committed to environment friendly practices. Our PEB's are designed to be energy-efficient, reducing the carbon footprint of your construction project. We prioritize sustainable materials and methods to contribute to a greener future.",
  },
  {
    id: "quality-control",
    title: "Quality Control",
    image: "/images/peb-advantages/quality-control.png",
    description:
      "PEB's are manufactured in a controlled environment, ensuring precision and strict quality standards. This process delivers consistently superior structures, minimizing the risk of errors.",
  },
  {
    id: "structural-efficiency-and-durability",
    title: "Structural Efficiency and Durability",
    image: "/images/peb-advantages/structural-efficiency-and-durability.png",
    description:
      "PEB's are engineered for structural efficiency, ensuring optimal use of materials without compromising strength. The use of high-grade steel contributes to the durability and resilience of the structures, making them capable of withstanding environmental conditions.",
  },
]

function PebAdvantageTile({
  item,
  index,
  onClick,
}: {
  item: PebAdvantageItem
  index: number
  onClick: (item: PebAdvantageItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        "group flex h-full min-h-[210px] w-full cursor-pointer flex-col items-center rounded-2xl border border-border/80 bg-card px-5 py-5 text-center transition-all duration-300 sm:min-h-[220px] sm:px-6 sm:py-6",
        "hover:-translate-y-1 hover:border-steel-red/25 hover:shadow-[0_18px_42px_rgba(0,0,0,0.08)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel-red/40 focus-visible:ring-offset-2"
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-steel-red/15 bg-gradient-to-b from-steel-red/[0.05] to-background p-4 shadow-sm sm:h-24 sm:w-24 sm:p-5">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading={index < 5 ? "eager" : "lazy"}
        />
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
        <h3 className="max-w-[16rem] text-base font-semibold leading-snug text-foreground sm:text-lg">
          {item.title}
        </h3>
      </div>
    </button>
  )
}

function PebAdvantageRow({
  items,
  startIndex,
  onClick,
  className,
}: {
  items: PebAdvantageItem[]
  startIndex: number
  onClick: (item: PebAdvantageItem) => void
  className?: string
}) {
  return (
    <div className={cn("flex w-full flex-wrap justify-center gap-4", className)}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="w-full sm:basis-[calc(50%-0.5rem)] xl:basis-[208px] xl:max-w-[208px]"
        >
          <PebAdvantageTile
            item={item}
            index={index + startIndex}
            onClick={onClick}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Advantages of PEB section: keeps the same CMS section type wiring,
 * but now renders card-based highlights with a modal instead of the old SVG wheel.
 */
export function PebAdvantageSvgSection({ className }: { className?: string }) {
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])
  const [selectedItem, setSelectedItem] = useState<PebAdvantageItem | null>(null)

  const firstRow = PEB_ADVANTAGE_ITEMS.slice(0, 5)
  const secondRow = PEB_ADVANTAGE_ITEMS.slice(5)

  return (
    <>
      <section
        className={cn(
          "border-t border-border bg-background",
          spacing.sectionPadding,
          className
        )}
      >
        <div
          className={cn(
            "mx-auto flex flex-col items-center",
            spacing.containerMaxWidth,
            "px-6 lg:px-8"
          )}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Advantages of PEB
            </h2>
          </div>

          <PebAdvantageRow
            items={firstRow}
            startIndex={0}
            onClick={setSelectedItem}
            className="mt-12 max-w-[1104px]"
          />

          <PebAdvantageRow
            items={secondRow}
            startIndex={firstRow.length}
            onClick={setSelectedItem}
            className="mt-4 max-w-[880px]"
          />
        </div>
      </section>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="w-[min(92vw,720px)] max-w-[720px] sm:max-w-[720px] max-h-[85vh] overflow-y-auto rounded-[28px] border border-border/80 p-0 shadow-[0_30px_80px_rgba(0,0,0,0.16)]">
          {selectedItem && (
            <div className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-steel-red/[0.12] via-background to-background" />

              <div className="relative px-6 pb-7 pt-10 sm:px-8 sm:pb-8 sm:pt-11">
                <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                  <div className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-8 duration-500 ease-out flex h-24 w-24 items-center justify-center rounded-full border border-steel-red/15 bg-background p-5 shadow-sm sm:h-28 sm:w-28 sm:p-6">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.title}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <DialogHeader className="mt-6 items-center text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-150">
                    <DialogTitle className="max-w-xl text-2xl font-bold leading-tight text-foreground sm:text-[34px]">
                      {selectedItem.title}
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="max-w-2xl pt-3 text-base leading-8 text-muted-foreground sm:text-lg">
                        <p>{selectedItem.description}</p>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
