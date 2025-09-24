import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Predefined skeleton components for common use cases
const SkeletonText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    lines?: number
    width?: "full" | "3/4" | "1/2" | "1/3" | "1/4"
  }
>(({ className, lines = 1, width = "full", ...props }, ref) => {
  const widthClasses = {
    full: "w-full",
    "3/4": "w-3/4", 
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "1/4": "w-1/4",
  }

  if (lines === 1) {
    return (
      <Skeleton
        ref={ref}
        className={cn("h-4", widthClasses[width], className)}
        {...props}
      />
    )
  }

  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? widthClasses[width] : "w-full"
          )}
        />
      ))}
    </div>
  )
})
SkeletonText.displayName = "SkeletonText"

const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg" | "xl"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  return (
    <Skeleton
      ref={ref}
      className={cn("rounded-full", sizeClasses[size], className)}
      {...props}
    />
  )
})
SkeletonAvatar.displayName = "SkeletonAvatar"

const SkeletonButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg"
    variant?: "default" | "outline" | "ghost"
  }
>(({ className, size = "md", variant = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 px-3",
    md: "h-10 px-4", 
    lg: "h-11 px-8",
  }

  return (
    <Skeleton
      ref={ref}
      className={cn(
        "rounded-md",
        sizeClasses[size],
        variant === "outline" && "bg-transparent border border-muted",
        variant === "ghost" && "bg-muted/50",
        className
      )}
      {...props}
    />
  )
})
SkeletonButton.displayName = "SkeletonButton"

const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    showHeader?: boolean
    showFooter?: boolean
    lines?: number
  }
>(({ className, showHeader = true, showFooter = false, lines = 3, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border bg-card p-6 space-y-4", className)}
    {...props}
  >
    {showHeader && (
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )}
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
    {showFooter && (
      <div className="flex gap-2 pt-2">
        <SkeletonButton size="sm" />
        <SkeletonButton size="sm" variant="outline" />
      </div>
    )}
  </div>
))
SkeletonCard.displayName = "SkeletonCard"

const SkeletonTable = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    rows?: number
    columns?: number
    showHeader?: boolean
  }
>(({ className, rows = 5, columns = 4, showHeader = true, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-3", className)} {...props}>
    {showHeader && (
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-20" />
        ))}
      </div>
    )}
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4"
            />
          ))}
        </div>
      ))}
    </div>
  </div>
))
SkeletonTable.displayName = "SkeletonTable"

const SkeletonList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    items?: number
    showAvatar?: boolean
    showIcon?: boolean
  }
>(({ className, items = 5, showAvatar = false, showIcon = false, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-3", className)} {...props}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        {showAvatar && <SkeletonAvatar size="sm" />}
        {showIcon && <Skeleton className="h-4 w-4" />}
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    ))}
  </div>
))
SkeletonList.displayName = "SkeletonList"

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList 
}