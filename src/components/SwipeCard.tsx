'use client'
import { useSwipeable } from 'react-swipeable'

export function SwipeCard({ children, onSwipe }: {
  children: React.ReactNode
  onSwipe: (direction: 'left' | 'right') => void
}) {
  const handlers = useSwipeable({
    onSwipedLeft: () => onSwipe('left'),
    onSwipedRight: () => onSwipe('right'),
    trackMouse: true
  })

  return <div {...handlers}>{children}</div>
}