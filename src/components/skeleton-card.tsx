// Use UI components from the target project
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton" // Assuming a generic Skeleton component exists
import { cn } from "@/lib/utils" // Assuming cn utility exists

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn("overflow-hidden bg-zinc-800/50 border-zinc-700/50", className)}>
      {/* Skeleton for Image */}
      <Skeleton className="aspect-square w-full" /> 
      <CardContent className="p-4 space-y-3">
        {/* Skeleton for Title */}
        <Skeleton className="h-6 w-3/4 rounded" /> 
        {/* Skeleton for Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
        {/* Skeleton for Date */}
        <Skeleton className="h-3 w-1/4 rounded mt-1" /> 
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        {/* Skeleton for Likes */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-8 rounded" />
        </div>
        {/* Skeleton for Action Buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardFooter>
    </Card>
  )
} 