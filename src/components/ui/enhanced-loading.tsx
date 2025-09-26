import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, Sparkles, Clock, Zap, CheckCircle2, AlertCircle, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const loadingVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      variant: {
        spinner: "animate-spin",
        dots: "",
        pulse: "animate-pulse",
        bounce: "",
        wave: "",
        progress: "",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      color: {
        primary: "text-primary",
        secondary: "text-secondary",
        muted: "text-muted-foreground",
        success: "text-success",
        warning: "text-warning",
        error: "text-destructive",
      },
    },
    defaultVariants: {
      variant: "spinner",
      size: "default",
      color: "primary",
    },
  }
)

export interface LoadingProps extends VariantProps<typeof loadingVariants> {
  className?: string
  fullScreen?: boolean
  overlay?: boolean
  message?: string
  progress?: number
  showIcon?: boolean
}

export function Loading({
  variant = "spinner",
  size = "default",
  color = "primary",
  className,
  fullScreen = false,
  overlay = false,
  message,
  progress,
  showIcon = true,
  ...props
}: LoadingProps) {
  const LoadingIcon = React.useMemo(() => {
    switch (variant) {
      case "spinner":
        return Loader2
      case "pulse":
        return Sparkles
      case "progress":
        return Clock
      default:
        return Loader2
    }
  }, [variant])

  const renderLoading = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-current",
                  size === "sm" && "h-1 w-1",
                  size === "default" && "h-1.5 w-1.5",
                  size === "lg" && "h-2 w-2",
                  size === "xl" && "h-3 w-3"
                )}
                style={{
                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                }}
              />
            ))}
          </div>
        )
      
      case "bounce":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-current animate-bounce",
                  size === "sm" && "h-2 w-2",
                  size === "default" && "h-3 w-3",
                  size === "lg" && "h-4 w-4",
                  size === "xl" && "h-6 w-6"
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )
      
      case "wave":
        return (
          <div className="flex space-x-1 items-end">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "bg-current rounded-sm",
                  size === "sm" && "w-0.5 h-3",
                  size === "default" && "w-1 h-4",
                  size === "lg" && "w-1.5 h-6",
                  size === "xl" && "w-2 h-8"
                )}
                style={{
                  animation: `wave 1.2s ease-in-out ${i * 0.1}s infinite`,
                }}
              />
            ))}
          </div>
        )
      
      case "progress":
        return (
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between mb-2">
              {showIcon && <Clock className={cn(loadingVariants({ size, color }))} />}
              {progress !== undefined && (
                <span className="text-sm font-medium text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress || 0}%` }}
              />
            </div>
          </div>
        )
      
      default:
        return showIcon && <LoadingIcon className={cn(loadingVariants({ variant, size, color }))} />
    }
  }

  const content = (
    <div className={cn("flex flex-col items-center space-y-3", className)}>
      <div className={cn(loadingVariants({ color }))}>
        {renderLoading()}
      </div>
      {message && (
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-inherit">
        {content}
      </div>
    )
  }

  return content
}

// State-based loading component
export interface StateLoadingProps {
  state: "loading" | "success" | "error" | "idle"
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
  size?: "sm" | "default" | "lg" | "xl"
  showIcon?: boolean
  className?: string
  onRetry?: () => void
}

export function StateLoading({
  state,
  loadingMessage = "Loading...",
  successMessage = "Success!",
  errorMessage = "Something went wrong",
  size = "default",
  showIcon = true,
  className,
  onRetry,
}: StateLoadingProps) {
  const stateConfig = {
    loading: {
      icon: Loader2,
      color: "text-primary",
      message: loadingMessage,
      animate: "animate-spin",
    },
    success: {
      icon: CheckCircle2,
      color: "text-success",
      message: successMessage,
      animate: "animate-bounce",
    },
    error: {
      icon: XCircle,
      color: "text-destructive",
      message: errorMessage,
      animate: "",
    },
    idle: {
      icon: null,
      color: "",
      message: "",
      animate: "",
    },
  }

  const config = stateConfig[state]
  const Icon = config.icon

  if (state === "idle") return null

  return (
    <div className={cn("flex flex-col items-center space-y-3", className)}>
      {showIcon && Icon && (
        <Icon 
          className={cn(
            config.color,
            config.animate,
            {
              "h-4 w-4": size === "sm",
              "h-6 w-6": size === "default",
              "h-8 w-8": size === "lg",
              "h-12 w-12": size === "xl",
            }
          )} 
        />
      )}
      {config.message && (
        <p className="text-sm text-center max-w-xs text-muted-foreground">
          {config.message}
        </p>
      )}
      {state === "error" && onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary hover:text-primary/80 underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  )
}

// Inline loading component for buttons and small spaces
export function InlineLoading({
  size = "sm",
  variant = "spinner",
  className,
  ...props
}: Pick<LoadingProps, "size" | "variant" | "className">) {
  return (
    <Loading
      size={size}
      variant={variant}
      className={cn("inline-flex", className)}
      showIcon={true}
      {...props}
    />
  )
}

// Page loading component with skeleton content
export function PageLoading({
  message = "Loading page...",
  showSkeleton = true,
  skeletonType = "card",
}: {
  message?: string
  showSkeleton?: boolean
  skeletonType?: "card" | "list" | "table"
}) {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-center py-12">
        <Loading
          variant="spinner"
          size="lg"
          message={message}
          color="primary"
        />
      </div>
      
      {showSkeleton && (
        <div className="space-y-6">
          {skeletonType === "card" && (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-48 mb-4" />
                    <div className="space-y-2">
                      <div className="bg-muted rounded h-4 w-3/4" />
                      <div className="bg-muted rounded h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {skeletonType === "list" && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="bg-muted rounded-full h-10 w-10" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted rounded h-4 w-3/4" />
                    <div className="bg-muted rounded h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {skeletonType === "table" && (
            <div className="space-y-3 animate-pulse">
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-muted rounded h-6" />
                ))}
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="bg-muted rounded h-4" />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { loadingVariants }