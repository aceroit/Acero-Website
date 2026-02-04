"use client"

import { useState , useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CustomSelect } from "@/components/ui/custom-select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FileUpload } from "./file-upload"
import { useToast } from "@/hooks/use-toast"
import {
  experienceLevels,
  educationLevels,
  languages,
} from "@/utils/career-data"
import { useVacancies } from "@/hooks/use-vacancies"
import { uploadCV, submitApplication, type CVFile } from "@/services/application.service"
import { cn } from "@/lib/utils"

// Inline type definitions (temporary)
interface CareerFormData {
  firstName: string
  lastName: string
  email: string
  mobileNumber: string
  country: string
  vacancyId: string
  experienceLevel: string
  educationLevel: string
  hasEngineeringDegree: string // "yes" | "no" | ""
  languages: string[]
  coverLetter: string
  cvFile: File | null // Only File during form interaction, converted to CVFile on submit
}

interface FormErrors {
  [key: string]: string
}

interface CareerApplicationFormProps {
  selectedVacancyId?: string
}

export function CareerApplicationForm({ selectedVacancyId }: CareerApplicationFormProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const router = useRouter()
  const { toast } = useToast()
  const { vacancies, isLoading: vacanciesLoading } = useVacancies()
  const [submitting, setSubmitting] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState<CareerFormData>({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    country: "",
    vacancyId: selectedVacancyId || "",
    experienceLevel: "",
    educationLevel: "",
    hasEngineeringDegree: "",
    languages: [],
    coverLetter: "",
    cvFile: null,
  })

  // Update vacancyId when selectedVacancyId prop changes
  useEffect(() => {
    if (selectedVacancyId && selectedVacancyId !== formData.vacancyId) {
      setFormData((prev) => ({
        ...prev,
        vacancyId: selectedVacancyId,
      }))
      // Clear vacancy error if it exists
      if (errors.vacancyId) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.vacancyId
          return newErrors
        })
      }
    }
  }, [selectedVacancyId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required"
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required"
    }
    if (!formData.vacancyId) {
      newErrors.vacancyId = "Please select a vacancy"
    }
    if (!formData.experienceLevel) {
      newErrors.experienceLevel = "Please select experience level"
    }
    if (!formData.educationLevel) {
      newErrors.educationLevel = "Please select education level"
    }
    // Engineering degree commented out for now
    // if (!formData.hasEngineeringDegree) {
    //   newErrors.hasEngineeringDegree = "Please select an option"
    // }
    if (formData.languages.length === 0) {
      newErrors.languages = "Please select at least one language"
    }
    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = "Cover letter is required"
    }
    if (!formData.cvFile) {
      newErrors.cvFile = "CV file is required"
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
      // Step 1: Upload CV file
      if (!formData.cvFile) {
        throw new Error('CV file is required')
      }

      setUploadingCV(true)
      const cvFileData = await uploadCV(formData.cvFile)
      setUploadingCV(false)

      // Step 2: Submit application
      const applicationData = {
        vacancyId: formData.vacancyId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        mobileNumber: formData.mobileNumber.trim(),
        country: formData.country.trim(),
        experienceLevel: formData.experienceLevel,
        educationLevel: formData.educationLevel,
        hasEngineeringDegree: (formData.hasEngineeringDegree || 'no') as 'yes' | 'no',
        languages: formData.languages,
        coverLetter: formData.coverLetter.trim(),
        cvFile: cvFileData,
      }

      await submitApplication(applicationData)

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
      })

    // Redirect to thank you page
    router.push("/thank-you?from=career")
    } catch (error) {
      console.error('Application submission error:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setUploadingCV(false)
    }
  }

  const handleLanguageToggle = (languageValue: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(languageValue)
        ? prev.languages.filter((lang) => lang !== languageValue)
        : [...prev.languages, languageValue],
    }))
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
    <div className="w-full">
      {/* Form Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <h2 className="text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Job Application Form
        </h2>
        <div className="mx-auto mt-4 h-1 w-24 bg-gradient-to-r from-transparent via-steel-red to-transparent" />
      </motion.div>

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
      {/* Section 1: Personal Information */}
      <motion.div
        variants={sectionVariants}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-500 hover:border-steel-red/30 hover:shadow-xl md:p-10"
      >
        {/* Premium gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-500 group-hover:from-steel-red/5 group-hover:via-steel-red/2 group-hover:to-steel-red/5" />
        
        <div className="relative z-10 space-y-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Personal Information
            </h2>
          </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className={cn("h-12", errors.firstName && "border-destructive")}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className={cn("h-12", errors.lastName && "border-destructive")}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={cn("h-12", errors.email && "border-destructive")}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="mobileNumber"
              className="text-sm font-medium text-foreground"
            >
              Mobile Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) =>
                setFormData({ ...formData, mobileNumber: e.target.value })
              }
              className={cn("h-12", errors.mobileNumber && "border-destructive")}
              placeholder="+971 XX XXX XXXX"
            />
            {errors.mobileNumber && (
              <p className="text-xs text-destructive">{errors.mobileNumber}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="country" className="text-sm font-medium text-foreground">
              Country <span className="text-destructive">*</span>
            </Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className={cn("h-12", errors.country && "border-destructive")}
              placeholder="Enter your country"
            />
            {errors.country && (
              <p className="text-xs text-destructive">{errors.country}</p>
            )}
          </div>
        </div>
        </div>
      </motion.div>

      {/* Section 2: Job Details, Experience & Education (one card) */}
      <motion.div
        variants={sectionVariants}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-500 hover:border-steel-red/30 hover:shadow-xl md:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-500 group-hover:from-steel-red/5 group-hover:via-steel-red/2 group-hover:to-steel-red/5" />
        <div className="relative z-10 space-y-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Job Details, Experience & Education
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
            {/* Job Details */}
            <div className="space-y-2">
              <Label htmlFor="vacancyId" className="text-sm font-medium text-foreground">
                Current Vacancies Applied For <span className="text-destructive">*</span>
              </Label>
              <CustomSelect
                value={formData.vacancyId}
                onValueChange={(value) => setFormData({ ...formData, vacancyId: value })}
                options={
                  vacancies.length === 0 && !vacanciesLoading
                    ? [{ value: "no-vacancies", label: "No vacancies available", isDisabled: true }]
                    : vacancies.map((vacancy) => ({
                        value: vacancy._id,
                        label: `${vacancy.title} - ${vacancy.department}`,
                      }))
                }
                placeholder={vacanciesLoading ? "Loading vacancies..." : "Select a vacancy"}
                isDisabled={vacanciesLoading}
                className={cn("h-12 w-full", errors.vacancyId && "border-destructive")}
              />
              {errors.vacancyId && (
                <p className="text-xs text-destructive">{errors.vacancyId}</p>
              )}
            </div>
            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="experienceLevel" className="text-sm font-medium text-foreground">
                Experience Level <span className="text-destructive">*</span>
              </Label>
              <CustomSelect
                value={formData.experienceLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, experienceLevel: value })
                }
                options={experienceLevels.map((level) => ({
                  value: level.value,
                  label: level.label,
                }))}
                placeholder="Select experience level"
                className={cn("h-12 w-full", errors.experienceLevel && "border-destructive")}
              />
              {errors.experienceLevel && (
                <p className="text-xs text-destructive">{errors.experienceLevel}</p>
              )}
            </div>
            {/* Education */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="educationLevel" className="text-sm font-medium text-foreground">
                  Level of Education <span className="text-destructive">*</span>
                </Label>
                <CustomSelect
                  value={formData.educationLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, educationLevel: value })
                  }
                  options={educationLevels.map((level) => ({
                    value: level.value,
                    label: level.label,
                  }))}
                  placeholder="Select education level"
                  className={cn("h-12 w-full", errors.educationLevel && "border-destructive")}
                />
                {errors.educationLevel && (
                  <p className="text-xs text-destructive">{errors.educationLevel}</p>
                )}
              </div>
              {/* Engineering Degree – commented out for now */}
              {/* <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Engineering Degree <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formData.hasEngineeringDegree}
                  onValueChange={(value) =>
                    setFormData({ ...formData, hasEngineeringDegree: value })
                  }
                  className="flex flex-row gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="engineering-yes" />
                    <Label htmlFor="engineering-yes" className="cursor-pointer text-sm font-normal text-foreground">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="engineering-no" />
                    <Label htmlFor="engineering-no" className="cursor-pointer text-sm font-normal text-foreground">
                      No
                    </Label>
                  </div>
                </RadioGroup>
                {errors.hasEngineeringDegree && (
                  <p className="text-xs text-destructive">{errors.hasEngineeringDegree}</p>
                )}
              </div> */}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 3: Languages */}
      <motion.div
        variants={sectionVariants}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-500 hover:border-steel-red/30 hover:shadow-xl md:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-500 group-hover:from-steel-red/5 group-hover:via-steel-red/2 group-hover:to-steel-red/5" />
        <div className="relative z-10 space-y-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Languages
            </h2>
          </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Please tick all languages the applicant can speak:{" "}
            <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {languages.map((language) => (
              <div key={language.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`language-${language.value}`}
                  checked={formData.languages.includes(language.value)}
                  onCheckedChange={() => handleLanguageToggle(language.value)}
                />
                <Label
                  htmlFor={`language-${language.value}`}
                  className="cursor-pointer text-sm font-normal text-foreground"
                >
                  {language.label}
                </Label>
              </div>
            ))}
          </div>
          {errors.languages && (
            <p className="text-xs text-destructive">{errors.languages}</p>
          )}
        </div>
        </div>
      </motion.div>

      {/* Section 4: Cover Letter */}
      <motion.div
        variants={sectionVariants}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-500 hover:border-steel-red/30 hover:shadow-xl md:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-500 group-hover:from-steel-red/5 group-hover:via-steel-red/2 group-hover:to-steel-red/5" />
        <div className="relative z-10 space-y-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Cover Letter
            </h2>
          </div>
        <div className="space-y-2">
          <Label htmlFor="coverLetter" className="text-sm font-medium text-foreground">
            Cover Letter <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="coverLetter"
            value={formData.coverLetter}
            onChange={(e) =>
              setFormData({ ...formData, coverLetter: e.target.value })
            }
            className={cn(
              "min-h-32 resize-none",
              errors.coverLetter && "border-destructive"
            )}
            placeholder="Paste or write your cover letter here..."
            rows={10}
          />
          {errors.coverLetter && (
            <p className="text-xs text-destructive">{errors.coverLetter}</p>
          )}
        </div>
        </div>
      </motion.div>

      {/* Section 5: CV Upload */}
      <motion.div
        variants={sectionVariants}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-500 hover:border-steel-red/30 hover:shadow-xl md:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-500 group-hover:from-steel-red/5 group-hover:via-steel-red/2 group-hover:to-steel-red/5" />
        <div className="relative z-10 space-y-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              CV Upload
            </h2>
          </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            CV File <span className="text-destructive">*</span>
          </Label>
          <p className="mb-4 text-xs text-muted-foreground">
            Only pdf, doc, jpeg, jpg, png – max size 2 MB
          </p>
          <FileUpload
            value={formData.cvFile}
            onChange={(file) => setFormData({ ...formData, cvFile: file })}
            error={errors.cvFile}
          />
        </div>
        </div>
      </motion.div>

      {/* Section 6: Submission */}
      <motion.div
        variants={sectionVariants}
        className="flex justify-center pt-8"
      >
        <Button
          type="submit"
          disabled={submitting || uploadingCV}
          className="group relative h-16 overflow-hidden bg-steel-red px-16 text-base font-semibold uppercase tracking-wider text-steel-white transition-all hover:bg-steel-red/90 hover:shadow-xl hover:shadow-steel-red/20 disabled:opacity-50"
        >
          <span className="relative z-10">
            {uploadingCV ? "Uploading CV..." : submitting ? "Submitting..." : "Submit Application"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </Button>
      </motion.div>
      </motion.form>
    </div>
  )
}

