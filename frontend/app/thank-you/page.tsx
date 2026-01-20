"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ThankYouPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from") || "contact"
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Redirect to previous page
          if (window.history.length > 1) {
            router.back()
          } else {
            // Fallback to home if no history
            router.push("/")
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const getMessage = () => {
    if (from === "career") {
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
              onClick={() => {
                if (window.history.length > 1) {
                  router.back()
                } else {
                  router.push("/")
                }
              }}
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

