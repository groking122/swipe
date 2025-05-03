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
      title="Advertise Your Project on MemeSwipe"
      description="Reach thousands of meme enthusiasts daily"
      imageUrl="/banner-ad-image.png"
      ctaText="Advertise Here"
      ctaUrl="/advertise"
      variant="banner"
      onDismiss={() => setDismissed(true)}
    />
  )
} 