"use client"

import { useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BranchAccordionItem } from "./branch-accordion-item"
import { useBranches } from "@/hooks/use-branches"
import { cn } from "@/lib/utils"

export function BranchSelectorSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { countries, isLoading } = useBranches()

  const [selectedCountry, setSelectedCountry] = useState<string>("")
  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      setSelectedCountry(countries[0].code)
    }
  }, [countries, selectedCountry])

  const selectedCountryData = countries.find((c) => c.code === selectedCountry)
  const firstBranchId = selectedCountryData?.branches[0]?._id ?? ""

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className="space-y-12"
    >
      <div className="space-y-6 text-center">
        <h2 className="text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Our Branches
        </h2>
        <div className="mx-auto h-1 w-24 bg-gradient-to-r from-transparent via-steel-red to-transparent" />
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
          Select a country to view our branch locations
        </p>
      </div>

      <div className="space-y-10">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <Label className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-foreground">
            Select Country
          </Label>
          <Select
            value={selectedCountry}
            onValueChange={setSelectedCountry}
            disabled={isLoading || countries.length === 0}
          >
            <SelectTrigger className="h-11 w-full max-w-[280px] border-2 border-border bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg">
              <SelectValue placeholder={isLoading ? "Loading…" : "Select a country"} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] w-[var(--radix-select-trigger-width)] max-w-[280px]">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCountryData && selectedCountryData.branches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Accordion
              key={selectedCountry}
              type="single"
              collapsible
              defaultValue={firstBranchId}
              className="space-y-6"
            >
              {selectedCountryData.branches.map((branch, index) => (
                <AccordionItem
                  key={branch._id}
                  value={branch._id}
                  className="group relative overflow-hidden rounded-2xl border-2 border-border/50 bg-card px-8 shadow-lg transition-all duration-700 hover:border-steel-red/40 hover:shadow-2xl hover:shadow-steel-red/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-700 group-hover:from-steel-red/8 group-hover:via-steel-red/3 group-hover:to-steel-red/8" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 transition-opacity duration-700 group-hover:via-white/5 group-hover:to-white/0" />

                  <AccordionTrigger className="relative z-10 py-8 text-left hover:no-underline">
                    <div className="flex items-center gap-6">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-steel-red/15 to-steel-red/5 text-2xl font-bold text-steel-red shadow-lg shadow-steel-red/10 transition-all duration-500 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-steel-red/25 group-hover:to-steel-red/10">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
                          {branch.name}
                        </h3>
                        <p className="mt-2 text-base font-medium text-muted-foreground md:text-lg">
                          {branch.location}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="relative z-10 pb-8 pt-6">
                    <BranchAccordionItem branch={branch} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        )}

        {selectedCountryData && selectedCountryData.branches.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No branches available for this country.</p>
          </div>
        )}

        {isLoading && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Loading branches…</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
