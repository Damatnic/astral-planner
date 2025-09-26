import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border bg-card shadow-enhanced-sm",
        elevated: "border-border bg-card shadow-enhanced-lg hover:shadow-enhanced-xl",
        outlined: "border-2 border-border bg-background hover:border-primary/50",
        filled: "border-border bg-muted hover:bg-muted/80",
        glass: "glass border-white/20 backdrop-blur-xl",
        gradient: "gradient-border bg-gradient-to-br from-background to-muted/50",
        floating: "shadow-enhanced-xl hover:shadow-enhanced-2xl border-border/50",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        false: "",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        xl: "p-10",
      },
      animation: {
        none: "",
        float: "hover:animate-float",
        glow: "animate-glow",
        pulse: "hover:animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
      size: "default",
      animation: "none",
    },
  }
)

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & 
    VariantProps<typeof cardVariants> & {
      loading?: boolean
      disabled?: boolean
    }
>(({ className, variant, interactive, size, animation, loading = false, disabled = false, children, ...props }, ref) => {
  const [isHovered, setIsHovered] = React.useState(false)
  
  return (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, interactive, size, animation }),
        loading && "animate-pulse opacity-70",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      {...props}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-shimmer"></div>
          <div className="h-3 bg-muted rounded w-3/4 animate-shimmer"></div>
          <div className="h-3 bg-muted rounded w-1/2 animate-shimmer"></div>
        </div>
      ) : (
        <>
          {children}
          {/* Interactive indicator */}
          {interactive && isHovered && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </>
      )}
    </div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "default" | "sm" | "lg"
    centered?: boolean
  }
>(({ className, size = "default", centered = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      {
        "p-4": size === "sm",
        "p-6": size === "default",
        "p-8": size === "lg",
        "text-center items-center": centered,
      },
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
    size?: "sm" | "default" | "lg" | "xl"
    gradient?: boolean
  }
>(({ className, as: Comp = "h3", size = "default", gradient = false, ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(
      "font-semibold leading-tight tracking-tight",
      {
        "text-lg": size === "sm",
        "text-xl": size === "default",
        "text-2xl": size === "lg",
        "text-3xl": size === "xl",
        "gradient-text": gradient,
      },
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: "sm" | "default" | "lg"
    muted?: boolean
  }
>(({ className, size = "default", muted = true, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "leading-relaxed",
      {
        "text-xs": size === "sm",
        "text-sm": size === "default",
        "text-base": size === "lg",
        "text-muted-foreground": muted,
        "text-foreground": !muted,
      },
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "default" | "sm" | "lg"
    noPadding?: boolean
  }
>(({ className, size = "default", noPadding = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      !noPadding && {
        "p-4 pt-0": size === "sm",
        "p-6 pt-0": size === "default",
        "p-8 pt-0": size === "lg",
      },
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "default" | "sm" | "lg"
    justify?: "start" | "center" | "end" | "between"
    bordered?: boolean
  }
>(({ className, size = "default", justify = "start", bordered = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center pt-0",
      {
        "p-4": size === "sm",
        "p-6": size === "default",
        "p-8": size === "lg",
        "justify-start": justify === "start",
        "justify-center": justify === "center",
        "justify-end": justify === "end",
        "justify-between": justify === "between",
        "border-t border-border mt-4": bordered,
      },
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }