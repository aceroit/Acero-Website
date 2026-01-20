"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { MapPin, Phone, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export function HeadOfficeSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const items = [
    {
      icon: MapPin,
      title: "Location",
      content: "Jebel Ali Industrial Area 1, Dubai, United Arab Emirates",
    },
    {
      icon: Phone,
      title: "Contact",
      content: (
        <>
          In the Dubai: +97148931000
          <br />
          Email: info@acero.ae
        </>
      ),
    },
    {
      icon: Clock,
      title: "Working Hours",
      content: "Monday - Friday: 8:00AM - 5:30PM",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
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
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Head Office
        </h2>
        <div className="mx-auto mt-6 h-1 w-24 bg-gradient-to-r from-transparent via-steel-red to-transparent" />
      </motion.div>

      <div className="grid gap-8 md:gap-10 lg:grid-cols-3">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-10 shadow-lg transition-all duration-700 hover:border-steel-red/40 hover:shadow-2xl hover:shadow-steel-red/10 md:p-12"
            >
              {/* Premium gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-steel-red/0 via-steel-red/0 to-steel-red/0 transition-all duration-700 group-hover:from-steel-red/8 group-hover:via-steel-red/3 group-hover:to-steel-red/8" />
              
              {/* Subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 transition-opacity duration-700 group-hover:via-white/5 group-hover:to-white/0" />

              <div className="relative z-10">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-steel-red/15 to-steel-red/5 text-steel-red shadow-lg shadow-steel-red/10 transition-all duration-500 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-steel-red/25 group-hover:to-steel-red/10 group-hover:shadow-xl group-hover:shadow-steel-red/20">
                  <Icon className="h-10 w-10" strokeWidth={2} />
                </div>
                <h3 className="mb-4 text-xl font-bold uppercase tracking-wider text-foreground md:text-2xl">
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  {item.content}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

