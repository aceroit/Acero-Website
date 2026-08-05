import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Thank You | Acero Building Systems",
  description: "Thank you for contacting Acero Building Systems. Your submission has been received successfully.",
}

export default function ThankYouLayout({ children }: { children: ReactNode }) {
  return children
}
