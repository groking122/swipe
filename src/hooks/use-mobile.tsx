import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Renamed to useIsMobile to match usage in memeswipe2/navigation.tsx
export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Changed return type to boolean as expected by navigation.tsx
  return !!isMobile 
} 