import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        shimmer: "bg-gradient-to-r from-muted via-muted/60 to-muted animate-shimmer bg-[length:200%_100%]",
        wave: "bg-muted relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        glow: "bg-muted animate-glow",
      },
      speed: {
        slow: "animate-pulse [animation-duration:2s]",
        normal: "animate-pulse",
        fast: "animate-pulse [animation-duration:0.8s]",
      },
    },
    defaultVariants: {
      variant: "shimmer",
      speed: "normal",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number
  height?: string | number
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

function Skeleton({
  className,
  variant,
  speed,
  width,
  height,
  rounded = "md",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        skeletonVariants({ variant, speed }),
        {
          "rounded-none": rounded === "none",
          "rounded-sm": rounded === "sm",
          "rounded-md": rounded === "md",
          "rounded-lg": rounded === "lg",
          "rounded-xl": rounded === "xl",
          "rounded-2xl": rounded === "2xl",
          "rounded-full": rounded === "full",
        },
        className
      )}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  )
}

// Preset skeleton components for common use cases
export function SkeletonText({ 
  lines = 1, 
  className, 
  lastLineWidth = "75%",
  ...props 
}: { 
  lines?: number
  lastLineWidth?: string
} & Omit<SkeletonProps, "height">) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? lastLineWidth : "100%"}
          {...props}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ 
  size = "default",
  ...props 
}: { 
  size?: "sm" | "default" | "lg" | "xl" 
} & Omit<SkeletonProps, "width" | "height" | "rounded">) {
  const dimensions = {
    sm: { width: "2rem", height: "2rem" },
    default: { width: "2.5rem", height: "2.5rem" },
    lg: { width: "3rem", height: "3rem" },
    xl: { width: "4rem", height: "4rem" },
  }
  
  return (
    <Skeleton
      width={dimensions[size].width}
      height={dimensions[size].height}
      rounded="full"
      {...props}
    />
  )
}

export function SkeletonCard({ 
  showAvatar = false,
  showImage = false,
  titleLines = 1,
  bodyLines = 3,
  className,
  ...props 
}: {
  showAvatar?: boolean
  showImage?: boolean
  titleLines?: number
  bodyLines?: number
} & SkeletonProps) {
  return (
    <div className={cn("space-y-4 p-6 border rounded-lg", className)}>
      {showImage && (
        <Skeleton height="12rem" width="100%" rounded="lg" {...props} />
      )}
      
      <div className="space-y-3">
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <SkeletonAvatar size="default" {...props} />
            <div className="space-y-2 flex-1">
              <SkeletonText lines={1} {...props} />
              <SkeletonText lines={1} lastLineWidth="60%" {...props} />
            </div>
          </div>
        )}
        
        <SkeletonText lines={titleLines} lastLineWidth="80%" {...props} />
        <SkeletonText lines={bodyLines} {...props} />
        
        <div className="flex space-x-2 pt-2">
          <Skeleton width="5rem" height="2rem" rounded="md" {...props} />
          <Skeleton width="4rem" height="2rem" rounded="md" {...props} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ 
  rows = 5,
  columns = 4,
  className,
  ...props 
}: {
  rows?: number
  columns?: number
} & SkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height="2rem" {...props} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              height="1.5rem" 
              width={Math.random() > 0.5 ? "100%" : "80%"}
              {...props} 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ 
  items = 5,
  showAvatar = true,
  className,
  ...props 
}: {
  items?: number
  showAvatar?: boolean
} & SkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          {showAvatar && <SkeletonAvatar size="default" {...props} />}
          <div className="flex-1 space-y-2">
            <SkeletonText lines={1} lastLineWidth="70%" {...props} />
            <SkeletonText lines={1} lastLineWidth="50%" {...props} />
          </div>
          <Skeleton width="4rem" height="2rem" rounded="md" {...props} />
        </div>
      ))}
    </div>
  )
}

export { Skeleton, skeletonVariants }