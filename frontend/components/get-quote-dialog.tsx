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
import { submitGetQuote } from "@/services/enquiry.service"
import { getRecaptchaToken } from "@/services/recaptcha.service"

interface GetQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface QuoteFormData {
  fullName: string
  email: string
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
  mobileNumber: "",
}

const MOBILE_NUMBER_REGEX = /^[0-9+\-\s()]{6,20}$/

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
      await submitGetQuote({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        mobileNumber: formData.mobileNumber.trim() || undefined,
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
      <DialogContent className="w-full max-w-[calc(100%-2rem)] rounded-3xl border-border/60 px-6 py-7 sm:max-w-xl sm:px-8">
        <DialogHeader className="space-y-3 text-left">
          <DialogTitle className="text-3xl font-bold tracking-tight text-foreground">
            Request a Quote
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground sm:text-base">
            Share your details and our team will get back to you with the right next
            steps for your requirement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="quote-full-name" className="text-sm font-semibold text-foreground">
              Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="quote-full-name"
                value={formData.fullName}
                onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
                className={cn("h-12 pl-10", errors.fullName && "border-destructive")}
                placeholder="Enter your name"
              />
            </div>
            {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName}</p> : null}
          </div>

          <div className="space-y-2.5">
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
                className={cn("h-12 pl-10", errors.email && "border-destructive")}
                placeholder="Enter your email"
              />
            </div>
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="quote-mobile" className="text-sm font-semibold text-foreground">
              Mobile
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="quote-mobile"
                value={formData.mobileNumber}
                onChange={(event) => setFormData((prev) => ({ ...prev, mobileNumber: event.target.value }))}
                className={cn("h-12 pl-10", errors.mobileNumber && "border-destructive")}
                placeholder="Enter your mobile number"
              />
            </div>
            <p className="text-xs text-muted-foreground">Optional, but helpful if you want a quicker callback.</p>
            {errors.mobileNumber ? (
              <p className="text-xs text-destructive">{errors.mobileNumber}</p>
            ) : null}
          </div>

          <Button type="submit" className="h-12 w-full text-sm font-semibold uppercase tracking-wider" disabled={submitting}>
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

