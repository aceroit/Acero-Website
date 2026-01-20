"use client"

import Image from "next/image"
import { Mail, Phone, MapPin } from "lucide-react"
import { GoogleMaps } from "./google-maps"
import { cn } from "@/lib/utils"

// Inline type definitions (temporary)
interface Branch {
  _id: string
  name: string
  location: string
  country: string
  email: string
  phone: string
  address: string
  logo?: string
  coordinates: {
    lat: number
    lng: number
  }
  isActive: boolean
}

interface BranchAccordionItemProps {
  branch: Branch
  className?: string
}

export function BranchAccordionItem({ branch, className }: BranchAccordionItemProps) {
  return (
    <div className={cn("grid gap-8 md:grid-cols-2", className)}>
      {/* Left: Branch Details */}
      <div className="space-y-8">
        {/* Logo */}
        {branch.logo && (
          <div className="relative h-24 w-40 overflow-hidden rounded-xl border-2 border-border/50 bg-card shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg">
            <Image
              src={branch.logo}
              alt={`${branch.name} logo`}
              fill
              className="object-contain p-3"
              sizes="160px"
            />
          </div>
        )}

        {/* Branch Location */}
        <div className="space-y-3">
          <div className="inline-block rounded-lg bg-steel-red/10 px-4 py-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-steel-red">
              {branch.location}
            </h4>
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-tight text-foreground md:text-3xl">
            {branch.name}
          </h3>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
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
        </div>
      </div>

      {/* Right: Google Maps */}
      <div className="h-full min-h-[350px] overflow-hidden rounded-xl border-2 border-border/50 shadow-lg transition-all hover:border-steel-red/30 hover:shadow-xl md:min-h-[450px]">
        <GoogleMaps
          markers={[
            {
              lat: branch.coordinates.lat,
              lng: branch.coordinates.lng,
              label: branch.location,
            },
          ]}
          center={branch.coordinates}
          zoom={15}
          height="100%"
          className="h-full rounded-xl"
        />
      </div>
    </div>
  )
}

