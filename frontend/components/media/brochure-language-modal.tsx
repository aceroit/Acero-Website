"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

// Inline type definitions (temporary)
interface BrochureLanguage {
  languageCode: string
  languageName: string
  fileUrl: string
}

interface Brochure {
  _id: string
  title: string
  brochureImage: { url: string; publicId: string; width: number; height: number }
  description?: string
  languages: BrochureLanguage[]
  order: number
  featured: boolean
  status: string
  isActive: boolean
}

interface BrochureLanguageModalProps {
  brochure: Brochure | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLanguageClick: (language: BrochureLanguage) => void
}

export function BrochureLanguageModal({
  brochure,
  open,
  onOpenChange,
  onLanguageClick,
}: BrochureLanguageModalProps) {
  if (!brochure) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {brochure.title}
          </DialogTitle>
          {brochure.description && (
            <DialogDescription className="text-base leading-relaxed text-muted-foreground">
              {brochure.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Select a language to view the brochure:
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <AnimatePresence>
              {brochure.languages.map((language, index) => (
                <motion.button
                  key={language.languageCode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => onLanguageClick(language)}
                  className={cn(
                    "group flex items-center justify-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-300",
                    "hover:border-steel-red hover:bg-steel-red hover:text-steel-white",
                    "focus:outline-none focus:ring-2 focus:ring-steel-red focus:ring-offset-2"
                  )}
                >
                  <FileText className="h-5 w-5 shrink-0 transition-colors group-hover:text-steel-white" />
                  <span className="text-base font-medium">{language.languageName}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

