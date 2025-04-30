"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  // Use a brand color consistent with the target project, assuming 'rose' from previous edits
  const brandGradient = "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
  const brandText = "text-rose-500"
  const brandBgLight = "bg-rose-50"
  const brandDarkBg = "dark:from-rose-950/40"

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-rose-50 to-neutral-50 p-4 ${brandDarkBg} dark:to-neutral-900`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="hidden rounded-lg bg-white p-2 shadow-sm dark:bg-neutral-800 sm:block">
            <span className={`text-xs font-semibold ${brandText}`}>AD</span>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Upgrade to MemeSwipe Pro for an ad-free experience!
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Get unlimited swipes, custom themes, and more.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            className={brandGradient}
          >
            Upgrade Now
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss ad"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 