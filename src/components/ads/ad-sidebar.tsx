"use client"

import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import AdComponent from "@/components/ads/ad-component"

// Mock ads data
const ads = [
  {
    id: "ad1",
    title: "Promote Your Project",
    description: "Reach thousands of meme enthusiasts with your project or company",
    imageUrl: "/placeholder.svg?height=250&width=300&text=Your+Project+Here",
    ctaText: "Advertise Here",
    ctaUrl: "/advertise",
  },
  {
    id: "ad2",
    title: "Showcase Your Brand",
    description: "Connect with our creative community",
    imageUrl: "/placeholder.svg?height=250&width=300&text=Your+Brand",
    ctaText: "Learn More",
    ctaUrl: "/advertise",
  },
]

export default function AdSidebar() {
  const [dismissedAds, setDismissedAds] = useState<string[]>([])

  const handleDismiss = (adId: string) => {
    setDismissedAds((prev) => [...prev, adId])
  }

  const visibleAds = ads.filter((ad) => !dismissedAds.includes(ad.id))

  if (visibleAds.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No advertisements to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Sponsored</h3>

      {visibleAds.map((ad, index) => (
        <div key={ad.id} className="space-y-6">
          <AdComponent
            id={ad.id}
            title={ad.title}
            description={ad.description}
            imageUrl={ad.imageUrl}
            ctaText={ad.ctaText}
            ctaUrl={ad.ctaUrl}
            variant="sidebar"
            onDismiss={handleDismiss}
          />
          {index < visibleAds.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
} 