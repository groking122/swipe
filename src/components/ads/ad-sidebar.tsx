"use client"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

// Mock ads data - adjust image paths if necessary
const ads = [
  {
    id: "ad1",
    title: "MemeSwipe Premium",
    description: "Unlock exclusive features and remove ads",
    image: "/placeholder-ad1.svg", // Use local placeholder or update path
    cta: "Upgrade Now",
  },
  {
    id: "ad2",
    title: "Create Better Memes",
    description: "Try our new AI meme generator",
    image: "/placeholder-ad2.svg", // Use local placeholder or update path
    cta: "Try It Free",
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
  
  // Use a brand color consistent with the target project, assuming 'rose' from previous edits
  const brandGradient = "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
  const brandBg = "bg-rose-500"

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Sponsored</h3>

      {visibleAds.map((ad, index) => (
        <div key={ad.id} className="space-y-6">
          <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-800">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30"
              onClick={() => handleDismiss(ad.id)}
              aria-label="Dismiss ad"
            >
              <X className="h-3 w-3" />
            </Button>

            <div className="relative h-40 w-full overflow-hidden">
              <Image src={ad.image || "/placeholder.svg"} alt={ad.title} fill className="object-cover" />
              <div className={`absolute bottom-0 left-0 rounded-tr-md ${brandBg} px-2 py-1`}>
                <span className="text-xs font-semibold text-white">AD</span>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-medium">{ad.title}</h4>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ad.description}</p>
              <Button
                className={`mt-3 w-full ${brandGradient}`}
                size="sm"
              >
                {ad.cta}
              </Button>
            </div>
          </div>

          {index < visibleAds.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
} 