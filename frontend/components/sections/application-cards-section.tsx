"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppearance } from "@/hooks/use-appearance"
import { getSpacingValues } from "@/utils/spacing"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface Application {
  id: string
  name: string
  icon: React.ReactNode
  svgPath?: string | null
  description?: string
  redirectUrl?: string
}

interface ApplicationCardsSectionProps {
  title?: string
  subtitle: string
  applications: Application[]
  columns?: number
  className?: string
  clickBehavior?: 'modal' | 'redirect' | 'both'
}

export function ApplicationCardsSection({
  title,
  subtitle,
  applications,
  columns,
  className,
  clickBehavior = 'both',
}: ApplicationCardsSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { appearance } = useAppearance()
  const spacing = useMemo(() => getSpacingValues(appearance), [appearance])
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const router = useRouter()

  const isClickable = clickBehavior === 'modal' || clickBehavior === 'redirect' || clickBehavior === 'both'

  const handleCardClick = (application: Application) => {
    if (clickBehavior === 'redirect' && application.redirectUrl) {
      router.push(application.redirectUrl)
      return
    }
    if (clickBehavior === 'modal' || clickBehavior === 'both') {
      setSelectedApplication(application)
    }
  }

  const getGridClasses = () => {
    if (columns) {
      const cols = Math.min(Math.max(columns, 2), 6)
      switch (cols) {
        case 2:
          return "grid-cols-2 sm:grid-cols-2 md:grid-cols-2"
        case 3:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-3"
        case 4:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        case 5:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        case 6:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        default:
          return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      }
    }

    const count = applications.length
    if (count <= 4) {
      return "grid-cols-2 sm:grid-cols-2 md:grid-cols-4"
    }
    if (count <= 6) {
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    }
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
  }

  return (
    <>
      <section
        ref={ref}
        className={cn("border-t border-border bg-background", spacing.sectionPadding, className)}
      >
        <div className={cn("mx-auto px-6 lg:px-8", spacing.containerMaxWidth)}>
          {title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
              className="mb-6 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl"
            >
              {title}
            </motion.h2>
          )}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            {subtitle}
          </motion.p>

          <div className={cn("grid", spacing.gridGap, getGridClasses())}>
            {applications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className={isClickable ? "cursor-pointer" : undefined}
                onClick={isClickable ? () => handleCardClick(application) : undefined}
              >
                <div className="group flex h-full flex-col items-center justify-center rounded-lg border border-border bg-card p-4 text-center transition-all hover:border-steel-red/50 hover:bg-card/50 md:p-6">
                  <div className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center text-steel-red transition-colors group-hover:text-steel-red/80 md:h-14 md:w-14">
                    {application.svgPath ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={application.svgPath}
                          alt={application.name}
                          fill
                          className="object-contain"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      application.icon
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-foreground md:text-base">
                    {application.name}
                  </h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application detail modal */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedApplication && (
            <div className="flex flex-col sm:flex-row">
              {/* Left: Image */}
              {selectedApplication.svgPath && (
                <div className="relative w-full sm:w-1/2 min-h-[200px] sm:min-h-[300px] bg-muted flex items-center justify-center">
                  <Image
                    src={selectedApplication.svgPath}
                    alt={selectedApplication.name}
                    fill
                    className="object-contain p-6"
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                </div>
              )}
              {/* Right: Text */}
              <div className={cn(
                "flex flex-col justify-center p-6",
                selectedApplication.svgPath ? "sm:w-1/2" : "w-full"
              )}>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    {selectedApplication.name}
                  </DialogTitle>
                  {selectedApplication.description && (
                    <DialogDescription className="mt-3 text-base leading-relaxed text-muted-foreground">
                      {selectedApplication.description}
                    </DialogDescription>
                  )}
                </DialogHeader>
                {clickBehavior === 'both' && selectedApplication.redirectUrl && (
                  <button
                    onClick={() => {
                      setSelectedApplication(null)
                      router.push(selectedApplication.redirectUrl!)
                    }}
                    className="mt-6 inline-flex items-center gap-2 self-start rounded-md bg-steel-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-steel-red/90"
                  >
                    View More
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
