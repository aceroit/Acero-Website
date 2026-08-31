"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { countriesWithDialCodes, getDialCodeForCountry } from "@/lib/countries"
import { submitGetQuote } from "@/services/enquiry.service"
import { getRecaptchaToken } from "@/services/recaptcha.service"

interface GetQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface QuoteFormData {
  fullName: string
  email: string
  country: string
  countryCode: string
  mobileNumber: string
}

interface QuoteFormErrors {
  fullName?: string
  email?: string
  mobileNumber?: string
}

const INITIAL_FORM_DATA: QuoteFormData = {
  fullName: "",
  email: "",
  country: "United Arab Emirates",
  countryCode: "+971",
  mobileNumber: "",
}

const MOBILE_NUMBER_REGEX = /^[0-9\-\s()]{6,20}$/
const COUNTRY_OPTIONS = countriesWithDialCodes
  .filter((country) => country.dialCode)
  .map((country) => ({
    value: country.value,
    label: country.label,
  }))
  .sort((first, second) => first.label.localeCompare(second.label))

const CODE_FIELD_CLASSES = cn(
  "h-12 w-24 shrink-0 cursor-default rounded-md border border-input bg-muted/50 px-3",
  "text-center text-sm font-semibold text-foreground shadow-sm outline-none sm:w-28"
)

export function GetQuoteDialog({ open, onOpenChange }: GetQuoteDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState<QuoteFormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<QuoteFormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_DATA)
      setErrors({})
      setSubmitting(false)
    }
  }, [open])

  const validateForm = () => {
    const nextErrors: QuoteFormErrors = {}
    const fullName = formData.fullName.trim()
    const email = formData.email.trim()
    const mobileNumber = formData.mobileNumber.trim()

    if (!fullName) {
      nextErrors.fullName = "Name is required"
    }

    if (!email) {
      nextErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address"
    }

    if (mobileNumber && !MOBILE_NUMBER_REGEX.test(mobileNumber)) {
      nextErrors.mobileNumber = "Please enter a valid mobile number"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the highlighted fields and try again.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const recaptchaToken = await getRecaptchaToken("get_quote_submit")
      const mobileNumber = formData.mobileNumber.trim()
      await submitGetQuote({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        country: mobileNumber ? formData.country : undefined,
        countryCode: mobileNumber ? formData.countryCode : undefined,
        mobileNumber: mobileNumber ? `${formData.countryCode} ${mobileNumber}` : undefined,
        recaptchaToken,
      })


      onOpenChange(false)
      router.push("/thank-you?from=quote")
    } catch (error) {
      console.error("Get quote submission error:", error)
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit quote request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!left-3 !right-3 !top-4 !bottom-auto !w-auto !max-w-none !translate-x-0 !translate-y-0 max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl border-border/60 px-5 py-5 sm:!left-1/2 sm:!right-auto sm:!top-1/2 sm:!bottom-auto sm:!w-full sm:!max-w-xl sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:max-h-[calc(100dvh-1.5rem)] sm:rounded-3xl sm:px-8 sm:py-7">
        <DialogHeader className="space-y-2 text-left sm:space-y-3">
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Request a Quote
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground sm:text-base">
            Share your details and our team will get back to you with the right next
            steps for your requirement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4 sm:space-y-5">
          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="quote-full-name" className="text-sm font-semibold text-foreground">
              Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="quote-full-name"
                value={formData.fullName}
                onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
                className={cn("h-11 pl-10 sm:h-12", errors.fullName && "border-destructive")}
                placeholder="Enter your name"
              />
            </div>
            {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName}</p> : null}
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="quote-email" className="text-sm font-semibold text-foreground">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="quote-email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                className={cn("h-11 pl-10 sm:h-12", errors.email && "border-destructive")}
                placeholder="Enter your email"
              />
            </div>
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="quote-mobile" className="text-sm font-semibold text-foreground">
              Mobile
            </Label>
            <select
              id="quote-country"
              aria-label="Country"
              value={formData.country}
              onChange={(event) => {
                const country = event.target.value
                setFormData((prev) => ({
                  ...prev,
                  country,
                  countryCode: getDialCodeForCountry(country) || prev.countryCode,
                }))
              }}
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex min-w-0 gap-2">
              <Input
                aria-label="Country code"
                readOnly
                tabIndex={-1}
                value={formData.countryCode}
                className={CODE_FIELD_CLASSES}
              />
              <div className="relative min-w-0 flex-1">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="quote-mobile"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(event) => setFormData((prev) => ({ ...prev, mobileNumber: event.target.value }))}
                  className={cn("h-12 pl-10", errors.mobileNumber && "border-destructive")}
                  placeholder="Mobile number"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Optional, but helpful if you want a quicker callback.</p>
            {errors.mobileNumber ? (
              <p className="text-xs text-destructive">{errors.mobileNumber}</p>
            ) : null}
          </div>

          <Button type="submit" className="h-11 w-full text-sm font-semibold uppercase tracking-wider sm:h-12" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

