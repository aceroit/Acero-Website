"use client"

import { useState } from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { submitEnquiry, type EnquiryData } from "@/services/enquiry.service"
import { cn } from "@/lib/utils"
import {
  countriesWithDialCodes,
  getDialCodeForCountry,
} from "@/lib/countries"

// Inline type definitions (temporary)
interface ContactFormData {
  purpose: string
  fullName: string
  companyName: string
  mobileNumber: string
  email: string
  country: string
  countryCode: string
  telephoneNumber: string
  subject: string
  message: string
}

interface FormErrors {
  [key: string]: string
}

const purposeOptions = [
  { value: "general", label: "General Inquiry" },
  { value: "sales", label: "Sales Inquiry" },
  { value: "support", label: "Support" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
]

export function ContactForm() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState<ContactFormData>({
    purpose: "",
    fullName: "",
    companyName: "",
    mobileNumber: "",
    email: "",
    country: "",
    countryCode: "",
    telephoneNumber: "",
    subject: "",
    message: "",
  })

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.purpose) {
      newErrors.purpose = "Please select a purpose"
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required"
    }
    if (!formData.country) {
      newErrors.country = "Please select your country"
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const enquiryData: EnquiryData = {
        purpose: formData.purpose as 'general' | 'sales' | 'support' | 'partnership' | 'other',
        fullName: formData.fullName.trim(),
        companyName: formData.companyName.trim() || undefined,
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        country: formData.country.trim(),
        countryCode: formData.countryCode.trim() || undefined,
        telephoneNumber: formData.telephoneNumber.trim() || undefined,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      }

      await submitEnquiry(enquiryData)

      toast({
        title: "Enquiry Submitted",
        description: "Your enquiry has been submitted successfully! We'll get back to you soon.",
      })

      // Redirect to thank you page
      router.push("/thank-you?from=contact")
    } catch (error) {
      console.error('Enquiry submission error:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit enquiry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <motion.form
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      onSubmit={handleSubmit}
      className="w-full space-y-8"
    >
      {/* Form Heading */}
      <motion.div
        variants={sectionVariants}
        className="mb-16 text-center"
      >
        <h2 className="text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Contact Us
        </h2>
        <div className="mx-auto mt-6 h-1 w-24 bg-gradient-to-r from-transparent via-steel-red to-transparent" />
        <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
          If you're looking to join our team, visit the{" "}
          <a href="/career" className="font-semibold text-steel-red transition-colors hover:underline">
            Career page
          </a>{" "}
          for exciting opportunities.
        </p>
      </motion.div>

      {/* Section 1: Purpose */}
      <motion.div
        variants={sectionVariants}
        className="group relative overflow-hidden rounded-2xl border-2 border-border/50 bg-card p-10 shadow-lg transition-all duration-700 hover:border-steel-red/40 hover:shadow-2xl hover:shadow-steel-red/10 md:p-12"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-700 group-hover:from-steel-red/8 group-hover:via-steel-red/3 group-hover:to-steel-red/8" />
        
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 transition-opacity duration-700 group-hover:via-white/5 group-hover:to-white/0" />
        
        <div className="relative z-10 space-y-6">
          <div className="mb-10 flex items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-steel-red/15 to-steel-red/5 text-2xl font-bold text-steel-red shadow-lg shadow-steel-red/10 transition-all duration-500 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-steel-red/25 group-hover:to-steel-red/10">
              1
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground md:text-3xl">
              Purpose
            </h2>
          </div>
          <div className="space-y-3">
            <Label htmlFor="purpose" className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Select Purpose <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.purpose}
              onValueChange={(value) => setFormData({ ...formData, purpose: value })}
            >
              <SelectTrigger
                id="purpose"
                className={cn("h-14 w-full border-2 bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg", errors.purpose && "border-destructive")}
              >
                <SelectValue placeholder="Choose one from the dropdown" />
              </SelectTrigger>
              <SelectContent>
                {purposeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.purpose && (
              <p className="text-xs font-medium text-destructive">{errors.purpose}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Section 2: Personal Details (with Country, Country Code auto, Mobile & Telephone) */}
      <motion.div
        variants={sectionVariants}
        className="group relative overflow-hidden rounded-2xl border-2 border-border/50 bg-card p-10 shadow-lg transition-all duration-700 hover:border-steel-red/40 hover:shadow-2xl hover:shadow-steel-red/10 md:p-12"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-700 group-hover:from-steel-red/8 group-hover:via-steel-red/3 group-hover:to-steel-red/8" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 transition-opacity duration-700 group-hover:via-white/5 group-hover:to-white/0" />
        <div className="relative z-10 space-y-6">
          <div className="mb-10 flex items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-steel-red/15 to-steel-red/5 text-2xl font-bold text-steel-red shadow-lg shadow-steel-red/10 transition-all duration-500 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-steel-red/25 group-hover:to-steel-red/10">
              2
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground md:text-3xl">
              Personal Details
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 [&>div]:min-w-0">
            <div className="space-y-3 sm:col-span-2">
              <Label htmlFor="fullName" className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className={cn("h-14 w-full min-w-0 border-2 bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg", errors.fullName && "border-destructive")}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-xs font-medium text-destructive">{errors.fullName}</p>
              )}
            </div>
            <div className="flex min-w-0 flex-col space-y-3">
              <Label htmlFor="companyName" className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Company Name
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="h-14 w-full min-w-0 border-2 bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg"
                placeholder="Enter your company name"
              />
            </div>
            <div className="flex min-w-0 flex-col space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={cn("h-14 w-full min-w-0 border-2 bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg", errors.email && "border-destructive")}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="text-xs font-medium text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="flex min-w-0 flex-col space-y-3">
              <Label htmlFor="country" className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Country <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => {
                  const dialCode = getDialCodeForCountry(value)
                  setFormData((prev) => ({
                    ...prev,
                    country: value,
                    countryCode: dialCode,
                  }))
                }}
              >
                <SelectTrigger
                  id="country"
                  className={cn("!h-14 min-h-[3.5rem] w-full min-w-0 border-2 bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg", errors.country && "border-destructive")}
                >
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countriesWithDialCodes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} {c.dialCode ? `(${c.dialCode})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-xs font-medium text-destructive">{errors.country}</p>
              )}
            </div>
            <div className="flex min-w-0 flex-col space-y-3">
              <Label htmlFor="countryCode" className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Country Code
              </Label>
              <Input
                id="countryCode"
                readOnly
                value={formData.countryCode}
                className="h-14 w-full min-w-0 border-2 bg-muted/50 text-base shadow-md cursor-default"
                placeholder="Auto from country"
              />
            </div>
            <div className="flex min-w-0 flex-col space-y-3">
              <Label htmlFor="mobileNumber" className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Mobile Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) =>
                  setFormData({ ...formData, mobileNumber: e.target.value })
                }
                className={cn("h-14 w-full min-w-0 border-2 bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg", errors.mobileNumber && "border-destructive")}
                placeholder={formData.countryCode ? `${formData.countryCode} XX XXX XXXX` : "XX XXX XXXX"}
              />
              {errors.mobileNumber && (
                <p className="text-xs font-medium text-destructive">{errors.mobileNumber}</p>
              )}
            </div>
            <div className="flex min-w-0 flex-col space-y-3">
              <Label htmlFor="telephoneNumber" className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Telephone (optional)
              </Label>
              <Input
                id="telephoneNumber"
                type="tel"
                value={formData.telephoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, telephoneNumber: e.target.value })
                }
                className="h-14 w-full min-w-0 border-2 bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg"
                placeholder={formData.countryCode ? `${formData.countryCode} XX XXX XXXX` : "Enter telephone number"}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 3: Message */}
      <motion.div
        variants={sectionVariants}
        className="group relative overflow-hidden rounded-2xl border-2 border-border/50 bg-card p-10 shadow-lg transition-all duration-700 hover:border-steel-red/40 hover:shadow-2xl hover:shadow-steel-red/10 md:p-12"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-700 group-hover:from-steel-red/8 group-hover:via-steel-red/3 group-hover:to-steel-red/8" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 transition-opacity duration-700 group-hover:via-white/5 group-hover:to-white/0" />
        <div className="relative z-10 space-y-6">
          <div className="mb-10 flex items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-steel-red/15 to-steel-red/5 text-2xl font-bold text-steel-red shadow-lg shadow-steel-red/10 transition-all duration-500 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-steel-red/25 group-hover:to-steel-red/10">
              3
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground md:text-3xl">
              Message
            </h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="subject" className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className={cn("h-14 border-2 bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg", errors.subject && "border-destructive")}
                placeholder="Enter subject"
              />
              {errors.subject && (
                <p className="text-xs font-medium text-destructive">{errors.subject}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label htmlFor="message" className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className={cn(
                  "min-h-40 resize-none border-2 bg-card text-base shadow-md transition-all hover:border-steel-red/30 hover:shadow-lg",
                  errors.message && "border-destructive"
                )}
                placeholder="Type your message here"
                rows={12}
              />
              {errors.message && (
                <p className="text-xs font-medium text-destructive">{errors.message}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 4: Submit */}
      <motion.div
        variants={sectionVariants}
        className="flex justify-center pt-12"
      >
        <Button
          type="submit"
          disabled={submitting}
          className="group relative h-20 overflow-hidden bg-gradient-to-r from-steel-red to-steel-red/90 px-20 text-lg font-bold uppercase tracking-wider text-steel-white shadow-2xl shadow-steel-red/30 transition-all hover:from-steel-red/95 hover:to-steel-red/85 hover:shadow-2xl hover:shadow-steel-red/40 disabled:opacity-50"
        >
          <span className="relative z-10">
            {submitting ? "Submitting..." : "Send Message"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        </Button>
      </motion.div>
    </motion.form>
  )
}

