"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useFormConfiguration } from "@/hooks/use-form-configuration"

const DEFAULT_SECTION = {
  thankYouTimeout: 5,
  thankYouRedirectUrl: "/",
}

function doRedirect(redirectUrl: string, router: ReturnType<typeof useRouter>) {
  if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
    window.location.href = redirectUrl
  } else {
    router.push(redirectUrl)
  }
}

export default function ThankYouPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const source = (searchParams.get("from") === "career" ? "career" : "contact") as "contact" | "career"
  const { formConfiguration } = useFormConfiguration()

  const section = useMemo(() => {
    if (!formConfiguration) return DEFAULT_SECTION
    const s = source === "career" ? formConfiguration.career : formConfiguration.contact
    return s ?? DEFAULT_SECTION
  }, [formConfiguration, source])

  const [countdown, setCountdown] = useState(section.thankYouTimeout)

  useEffect(() => {
    const timeout = section.thankYouTimeout
    const redirectUrl = section.thankYouRedirectUrl
    setCountdown(timeout)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          doRedirect(redirectUrl, router)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [section.thankYouTimeout, section.thankYouRedirectUrl, router])

  const getMessage = () => {
    if (source === "career") {
      return {
        title: "Application Submitted Successfully!",
        description:
          "Thank you for your interest in joining Acero Building Systems. We have received your application and will review it shortly.",
      }
    }
    return {
      title: "Message Sent Successfully!",
      description:
        "Thank you for contacting Acero Building Systems. We have received your message and will get back to you soon.",
    }
  }

  const message = getMessage()

  return (
    <>
      <Header />
      <main className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl px-6 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8 flex justify-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-steel-red/10">
              <CheckCircle2 className="h-16 w-16 text-steel-red" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-4 text-4xl font-bold text-foreground md:text-5xl"
          >
            {message.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8 text-lg text-muted-foreground"
          >
            {message.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <span>Redirecting in</span>
            <span className="font-bold text-steel-red">{countdown}</span>
            <span>second{countdown !== 1 ? "s" : ""}...</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8"
          >
            <button
              onClick={() => doRedirect(section.thankYouRedirectUrl, router)}
              className="text-sm text-steel-red hover:underline"
            >
              Click here if you are not redirected automatically
            </button>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </>
  )
}

