import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-enhanced-sm hover:shadow-enhanced-md hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-enhanced-sm hover:shadow-enhanced-md hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border border-input bg-background shadow-enhanced-sm hover:bg-accent hover:text-accent-foreground hover:shadow-enhanced-md active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-enhanced-sm hover:bg-secondary/80 hover:shadow-enhanced-md active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "brand-gradient text-white shadow-enhanced-md hover:shadow-enhanced-lg active:scale-[0.98] brand-gradient-hover",
        glass: "glass text-foreground shadow-enhanced-lg hover:shadow-enhanced-xl backdrop-blur-xl active:scale-[0.98]",
        floating: "bg-background shadow-enhanced-xl hover:shadow-enhanced-2xl text-foreground border border-border/50 hover:border-border active:scale-[0.98]",
        success: "bg-success text-success-foreground shadow-enhanced-sm hover:shadow-enhanced-md hover:bg-success/90 active:scale-[0.98]",
        warning: "bg-warning text-warning-foreground shadow-enhanced-sm hover:shadow-enhanced-md hover:bg-warning/90 active:scale-[0.98]",
        info: "bg-info text-info-foreground shadow-enhanced-sm hover:shadow-enhanced-md hover:bg-info/90 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-lg",
        "icon-xl": "h-14 w-14 rounded-xl",
      },
      animation: {
        none: "",
        pulse: "hover:animate-pulse",
        bounce: "hover:animate-bounce-subtle",
        glow: "animate-glow",
        shimmer: "relative before:absolute before:inset-0 before:animate-shimmer",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  tooltip?: string
  badge?: string | number
  ripple?: boolean
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    asChild = false, 
    loading = false, 
    loadingText, 
    leftIcon,
    rightIcon,
    fullWidth = false,
    tooltip,
    badge,
    ripple = true,
    children, 
    disabled, 
    onClick,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const [isPressed, setIsPressed] = React.useState(false)
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([])
    
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !loading) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newRipple = { id: Date.now(), x, y }
        
        setRipples(prev => [...prev, newRipple])
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id))
        }, 600)
      }
      
      onClick?.(e)
    }, [ripple, disabled, loading, onClick])
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, animation, className }),
          fullWidth && "w-full",
          "relative overflow-hidden"
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-label={loading ? loadingText || "Loading..." : props["aria-label"]}
        title={tooltip}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple Effect */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full animate-ping pointer-events-none"
            style={{
              left: ripple.x - 20,
              top: ripple.y - 20,
              width: 40,
              height: 40,
            }}
          />
        ))}
        
        {/* Loading State */}
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
            
            {/* Badge */}
            {badge && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-sm">
                {badge}
              </span>
            )}
          </>
        )}
        
        {/* Shimmer Effect for specific variants */}
        {animation === "shimmer" && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
        )}
      </Comp>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, buttonVariants }