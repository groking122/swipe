'use client';
import { useSwipeable } from 'react-swipeable';
import { Card } from '@/components/ui/card';

export const SwipeInterface = ({ children, onSwipe }: {
  children: React.ReactNode;
  onSwipe: (direction: 'left' | 'right') => Promise<void>;
}) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => onSwipe('left'),
    onSwipedRight: () => onSwipe('right'),
    trackMouse: true,
    preventScrollOnSwipe: true
  });

  return (
    <Card className="w-full h-[70vh] relative overflow-hidden">
      <div {...handlers} className="absolute inset-0">
        {children}
      </div>
    </Card>
  );
};