"use client"

import { useState } from "react"
import AdComponent from "@/components/ads/ad-component"

export default function AdBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return (
    <AdComponent
      id="banner-1"
      title=""
      description=""
      imageUrl="/chillguy_banner.png"
      ctaText="Advertise Here"
      ctaUrl="https://x.com/chillguycto"
      variant="banner-visual"
      onDismiss={() => setDismissed(true)}
    />
  )
} 