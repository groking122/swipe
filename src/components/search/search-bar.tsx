"use client"

import type React from "react"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsSearching(true)
      // TODO: Implement actual search logic (e.g., redirect or fetch results)
      console.log("Searching for:", query)
      // Simulate search delay
      setTimeout(() => {
        setIsSearching(false)
      }, 1000)
    }
  }

  const clearSearch = () => {
    setQuery("")
  }

  // Use a brand color consistent with the target project, assuming 'rose' from previous edits
  const brandGradient = "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"

  return (
    <form onSubmit={handleSearch} className="relative flex w-full max-w-2xl items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          type="search"
          placeholder="Search for memes..."
          className="pl-10 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button
        type="submit"
        className={`ml-2 ${brandGradient}`}
        disabled={!query.trim() || isSearching}
      >
        {isSearching ? "Searching..." : "Search"}
      </Button>
    </form>
  )
} 