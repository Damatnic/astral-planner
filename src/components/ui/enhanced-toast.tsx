import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Sparkles } from "lucide-react"
import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-enhanced-lg transition-all",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        success: "border-success/50 bg-success/10 text-success-foreground",
        error: "border-destructive/50 bg-destructive/10 text-destructive-foreground",
        warning: "border-warning/50 bg-warning/10 text-warning-foreground",
        info: "border-info/50 bg-info/10 text-info-foreground",
        premium: "border-primary/50 bg-gradient-to-r from-primary/10 to-purple-500/10 text-foreground",
      },
      size: {
        default: "p-4",
        sm: "p-3",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ToastProps extends VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  duration?: number
  closable?: boolean
  className?: string
}

// Enhanced toast function with better UX
export function enhancedToast({
  title,
  description,
  variant = "default",
  action,
  icon,
  duration = 4000,
  closable = true,
  className,
  ...props
}: ToastProps) {
  const getIcon = () => {
    if (icon) return icon
    
    switch (variant) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case "info":
        return <Info className="h-5 w-5 text-info" />
      case "premium":
        return <Sparkles className="h-5 w-5 text-primary" />
      default:
        return null
    }
  }

  const toastIcon = getIcon()

  return sonnerToast.custom(
    (t) => (
      <div
        className={cn(
          toastVariants({ variant, className }),
          "animate-in slide-in-from-right-full data-[swipe=move]:transition-none group-[.toaster]:border-border group-[.toaster]:shadow-enhanced-lg"
        )}
        {...props}
      >
        <div className="flex items-start space-x-3 flex-1">
          {toastIcon && (
            <div className="flex-shrink-0 mt-0.5">
              {toastIcon}
            </div>
          )}
          
          <div className="flex-1 space-y-1">
            {title && (
              <div className="text-sm font-semibold leading-tight">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
          
          {closable && (
            <button
              onClick={() => sonnerToast.dismiss(t)}
              className="flex-shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    ),
    {
      duration,
      id: `toast-${Date.now()}`,
    }
  )
}

// Convenience functions for different toast types
export const toast = {
  success: (title: string, description?: string, options?: Partial<ToastProps>) =>
    enhancedToast({
      title,
      description,
      variant: "success",
      ...options,
    }),

  error: (title: string, description?: string, options?: Partial<ToastProps>) =>
    enhancedToast({
      title,
      description,
      variant: "error",
      duration: 6000, // Longer duration for errors
      ...options,
    }),

  warning: (title: string, description?: string, options?: Partial<ToastProps>) =>
    enhancedToast({
      title,
      description,
      variant: "warning",
      ...options,
    }),

  info: (title: string, description?: string, options?: Partial<ToastProps>) =>
    enhancedToast({
      title,
      description,
      variant: "info",
      ...options,
    }),

  premium: (title: string, description?: string, options?: Partial<ToastProps>) =>
    enhancedToast({
      title,
      description,
      variant: "premium",
      ...options,
    }),

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) =>
    sonnerToast.promise(promise, {
      loading,
      success,
      error,
    }),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  
  custom: enhancedToast,
}

// Enhanced Toaster component with better positioning and styling
export function EnhancedToaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "0.5rem",
        },
        className: "shadow-enhanced-lg",
        duration: 4000,
      }}
      theme="system"
      richColors={false}
      expand={true}
      visibleToasts={5}
      closeButton={false}
      cn={(classes) => cn(classes, "font-sans")}
    />
  )
}

// Notification banner component for persistent messages
export interface NotificationBannerProps {
  variant?: "info" | "warning" | "error" | "success"
  title: string
  description?: string
  action?: React.ReactNode
  closable?: boolean
  className?: string
  onClose?: () => void
}

export function NotificationBanner({
  variant = "info",
  title,
  description,
  action,
  closable = true,
  className,
  onClose,
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case "info":
        return <Info className="h-5 w-5 text-info" />
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getBorderColor = () => {
    switch (variant) {
      case "success":
        return "border-l-success"
      case "error":
        return "border-l-destructive"
      case "warning":
        return "border-l-warning"
      case "info":
        return "border-l-info"
      default:
        return "border-l-muted-foreground"
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "border-l-4 bg-background p-4 shadow-enhanced-sm",
        getBorderColor(),
        "animate-in slide-in-from-top-1",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-semibold leading-tight text-foreground">
              {title}
            </h4>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
          
          {closable && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { toastVariants }