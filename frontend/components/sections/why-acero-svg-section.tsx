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

type WhyAceroItem = {
  id: string
  title: string
  description: string
  image: string
}

const WHY_ACERO_ITEMS: WhyAceroItem[] = [
  {
    id: "expertise-and-experience",
    title: "Expertise and Experience",
    image: "/images/why-acero/expertise-and-experience.png",
    description:
      "With years of experience in the industry, Acero boasts a team of experts who understand the intricacies of Pre-engineered steel buildings. We leverage our knowledge to deliver steel buildings that not only meet but exceed our customer's expectations.",
  },
  {
    id: "quality-assurance",
    title: "Quality Assurance",
    image: "/images/why-acero/quality-assurance.png",
    description:
      "Quality is at the core of everything we do. From the selection of materials to the manufacturing process, Acero is certified in ISO 9001, ISO 14001, ISO 45001, ISO 3834, AS/NZS ISO 3834 (Australia and New Zealand) and EN 1090 CE Certification (Europe).",
  },
  {
    id: "timely-delivery",
    title: "Timely Delivery",
    image: "/images/why-acero/timely-delivery.png",
    description:
      "We recognize the importance of timely project completion. Acero is dedicated to delivering PEBs on schedule without compromising on quality. Our streamlined processes and efficient project management ensure that your project stays on track always.",
  },
  {
    id: "explore-our-peb-solutions",
    title: "Explore Our PEB Solutions",
    image: "/images/why-acero/explore-our-peb-solutions.png",
    description:
      "Discover the possibilities with Acero's range of PEB solutions. Whether you are planning a new warehouse, industrial facility, commercial building or any other building or structure, we have the expertise and resources to bring your vision to life.",
  },
  {
    id: "seamless-project-management",
    title: "Seamless Project Management",
    image: "/images/why-acero/seamless-project-management.png",
    description:
      "Acero's experienced project management team ensures a seamless construction process from start to finish with our experienced erection coordinators. Our streamlined processes and attention to detail guarantee that projects are delivered on time, meeting and exceeding expectations.",
  },
  {
    id: "sustainability",
    title: "Sustainability",
    image: "/images/why-acero/sustainability.png",
    description:
      "We are committed to environment friendly practices. Our PEBs are designed to be energy-efficient, reducing the carbon footprint of your construction project. We prioritize sustainable materials and methods to contribute to a greener future.",
  },
  {
    id: "customization",
    title: "Customization",
    image: "/images/why-acero/customization.png",
    description:
      "We understand that each project is unique. At Acero, we offer customized PEBs tailored to your specific requirements. Our design and engineering team works closely with our customers to ensure that the final product aligns with their vision.",
  },
]

function WhyAceroTile({
  item,
  index,
  onClick,
}: {
  item: WhyAceroItem
  index: number
  onClick: (item: WhyAceroItem) => void
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
          loading={index < 4 ? "eager" : "lazy"}
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

function WhyAceroRow({
  items,
  startIndex,
  onClick,
  className,
}: {
  items: WhyAceroItem[]
  startIndex: number
  onClick: (item: WhyAceroItem) => void
  className?: string
}) {
  return (
    <div className={cn("flex w-full flex-wrap justify-center gap-4", className)}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="w-full sm:basis-[calc(50%-0.5rem)] lg:basis-[240px] lg:max-w-[240px]"
        >
          <WhyAceroTile
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
 * Why Acero section: replaces the old SVG wheel with clickable image tiles.
 * Uses the provided icon artwork and opens a modal with the detailed copy.
 */
export function WhyAceroSvgSection({ className }: { className?: string }) {
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])
  const [selectedItem, setSelectedItem] = useState<WhyAceroItem | null>(null)

  const firstRow = WHY_ACERO_ITEMS.slice(0, 4)
  const secondRow = WHY_ACERO_ITEMS.slice(4)

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
              Why Acero?
            </h2>
          </div>

          <WhyAceroRow
            items={firstRow}
            startIndex={0}
            onClick={setSelectedItem}
            className="mt-12 max-w-[1056px]"
          />

          <WhyAceroRow
            items={secondRow}
            startIndex={firstRow.length}
            onClick={setSelectedItem}
            className="mt-4 max-w-[800px]"
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
