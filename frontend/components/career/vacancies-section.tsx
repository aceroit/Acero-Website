"use client"

import { motion } from "framer-motion"
import { MapPin, Briefcase, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVacancies } from "@/hooks/use-vacancies"
import type { Vacancy } from "@/services/vacancy.service"
import { cn } from "@/lib/utils"

interface VacanciesSectionProps {
  onApplyNow: (vacancyId: string) => void
}

export function VacanciesSection({ onApplyNow }: VacanciesSectionProps) {
  const { vacancies, isLoading, error } = useVacancies()

  if (isLoading) {
    return (
      <section className="border-t border-border bg-background py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Loading vacancies...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="border-t border-border bg-background py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg text-destructive">Failed to load vacancies. Please try again later.</p>
          </div>
        </div>
      </section>
    )
  }

  if (vacancies.length === 0) {
    return null
  }

  return (
    <section className="border-t border-border bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Open Positions
          </h2>
          <div className="mx-auto mt-4 h-1 w-24 bg-gradient-to-r from-transparent via-steel-red to-transparent" />
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Join our team and be part of building the future. Explore our current job openings below.
          </p>
        </motion.div>

        {/* Vacancies Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vacancies.map((vacancy, index) => (
            <VacancyCard
              key={vacancy._id}
              vacancy={vacancy}
              index={index}
              onApplyNow={onApplyNow}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface VacancyCardProps {
  vacancy: Vacancy
  index: number
  onApplyNow: (vacancyId: string) => void
}

function VacancyCard({ vacancy, index, onApplyNow }: VacancyCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently posted"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleApplyNow = () => {
    onApplyNow(vacancy._id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-500 hover:border-steel-red/50 hover:shadow-xl"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-500 group-hover:from-steel-red/5 group-hover:via-steel-red/2 group-hover:to-steel-red/5" />

      <div className="relative z-10 flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="mb-2 text-xl font-bold text-foreground group-hover:text-steel-red transition-colors">
            {vacancy.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              <span>{vacancy.department}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{vacancy.location}</span>
            </div>
          </div>
        </div>

        {/* Type Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center rounded-full bg-steel-red/10 px-3 py-1 text-xs font-semibold text-steel-red">
            {vacancy.type}
          </span>
        </div>

        {/* Description Preview */}
        {vacancy.description && (
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {vacancy.description.substring(0, 150)}
            {vacancy.description.length > 150 ? "..." : ""}
          </p>
        )}

        {/* Requirements Preview */}
        {vacancy.requirements && vacancy.requirements.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">
              Key Requirements:
            </p>
            <ul className="space-y-1">
              {vacancy.requirements.slice(0, 3).map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-steel-red" />
                  <span className="line-clamp-1">{req}</span>
                </li>
              ))}
              {vacancy.requirements.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{vacancy.requirements.length - 3} more requirements
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(vacancy.publishedAt)}</span>
          </div>
          <Button
            onClick={handleApplyNow}
            className="group/btn h-9 gap-2 bg-steel-red px-4 text-xs font-semibold uppercase tracking-wider text-steel-white transition-all hover:bg-steel-red/90 hover:shadow-lg hover:shadow-steel-red/20"
          >
            Apply Now
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

