"use client"

import { Mail, Phone, MapPin, ExternalLink } from "lucide-react"
import { GoogleMaps } from "./google-maps"
import { cn } from "@/lib/utils"

export interface Branch {
  _id: string
  name: string
  location: string
  country: string
  email: string
  phone: string
  address: string
  logo?: string | null
  coordinates?: { lat: number; lng: number } | null
  googleLink?: string
}

interface BranchAccordionItemProps {
  branch: Branch
  className?: string
}

export function BranchAccordionItem({ branch, className }: BranchAccordionItemProps) {
  const hasCoordinates = branch.coordinates?.lat != null && branch.coordinates?.lng != null

  return (
    <div className={cn("grid items-stretch gap-8 md:grid-cols-2", className)}>
      {/* Left: Branch Details */}
      <div className="flex flex-col gap-6">
        {branch.email && (
          <div className="group flex items-start gap-4 rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-steel-red/30 hover:bg-card hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-steel-red/10 text-steel-red transition-colors group-hover:bg-steel-red/20">
              <Mail className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <a
                href={`mailto:${branch.email}`}
                className="text-base font-medium text-foreground transition-colors hover:text-steel-red md:text-lg"
              >
                {branch.email}
              </a>
            </div>
          </div>
        )}

        {branch.phone && (
          <div className="group flex items-start gap-4 rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-steel-red/30 hover:bg-card hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-steel-red/10 text-steel-red transition-colors group-hover:bg-steel-red/20">
              <Phone className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Phone
              </p>
              <a
                href={`tel:${branch.phone.replace(/\s/g, "")}`}
                className="text-base font-medium text-foreground transition-colors hover:text-steel-red md:text-lg"
              >
                {branch.phone}
              </a>
            </div>
          </div>
        )}

        {branch.address && (
          <div className="group flex items-start gap-4 rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-steel-red/30 hover:bg-card hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-steel-red/10 text-steel-red transition-colors group-hover:bg-steel-red/20">
              <MapPin className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Address
              </p>
              <p className="text-base leading-relaxed text-foreground md:text-lg">
                {branch.address}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Google Maps or Open in Maps link */}
      <div className="min-h-[200px] overflow-hidden rounded-xl border border-border shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl">
        {hasCoordinates ? (
          <GoogleMaps
            markers={[
              {
                lat: branch.coordinates!.lat,
                lng: branch.coordinates!.lng,
                label: branch.location,
              },
            ]}
            center={branch.coordinates!}
            zoom={15}
            height="100%"
            className="h-full min-h-[200px] rounded-xl"
          />
        ) : branch.googleLink ? (
          <a
            href={branch.googleLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col items-center justify-center gap-4 bg-muted/30 p-8 text-center transition-colors hover:bg-muted/50"
          >
            <MapPin className="h-16 w-16 text-steel-red" strokeWidth={1.5} />
            <span className="text-lg font-semibold text-foreground">
              View location on Google Maps
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </span>
          </a>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/30 p-8 text-center text-muted-foreground">
            Map not available for this branch.
          </div>
        )}
      </div>
    </div>
  )
}
