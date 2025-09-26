import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, Bell, Settings, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Card } from "@/components/ui/card"

const layoutVariants = cva(
  "min-h-screen bg-gradient-to-b from-background to-muted/20",
  {
    variants: {
      variant: {
        default: "",
        centered: "flex items-center justify-center",
        split: "grid lg:grid-cols-2",
        sidebar: "flex",
      },
      spacing: {
        none: "",
        default: "p-4 md:p-6 lg:p-8",
        comfortable: "p-6 md:p-8 lg:p-12",
        compact: "p-2 md:p-4 lg:p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      spacing: "default",
    },
  }
)

// Breadcrumb component
export interface BreadcrumbItem {
  href?: string
  label: string
  current?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
}

export function Breadcrumb({ items, className, separator }: BreadcrumbProps) {
  const pathname = usePathname()
  
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="mx-2 text-muted-foreground/60">
              {separator || <ChevronRight className="h-3 w-3" />}
            </span>
          )}
          {item.href && !item.current ? (
            <Link 
              href={item.href} 
              className="hover:text-foreground transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              "font-medium",
              item.current || pathname === item.href ? "text-foreground" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// Page header component
export interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  breadcrumb?: BreadcrumbItem[]
  className?: string
  size?: "default" | "lg" | "xl"
  gradient?: boolean
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
  className,
  size = "default",
  gradient = false,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} />
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h1 className={cn(
            "font-bold tracking-tight",
            {
              "text-2xl md:text-3xl": size === "default",
              "text-3xl md:text-4xl": size === "lg",
              "text-4xl md:text-5xl": size === "xl",
              "gradient-text": gradient,
            }
          )}>
            {title}
          </h1>
          
          {description && (
            <p className={cn(
              "text-muted-foreground leading-relaxed",
              {
                "text-base": size === "default",
                "text-lg": size === "lg",
                "text-xl": size === "xl",
              }
            )}>
              {description}
            </p>
          )}
        </div>
        
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced container component
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg" | "xl" | "full"
  center?: boolean
}

export function Container({ 
  className, 
  size = "default", 
  center = true, 
  children, 
  ...props 
}: ContainerProps) {
  return (
    <div
      className={cn(
        "w-full px-4 md:px-6 lg:px-8",
        center && "mx-auto",
        {
          "max-w-2xl": size === "sm",
          "max-w-6xl": size === "default",
          "max-w-7xl": size === "lg",
          "max-w-none": size === "xl" || size === "full",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Main layout component
export interface EnhancedLayoutProps extends VariantProps<typeof layoutVariants> {
  children: React.ReactNode
  header?: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  containerSize?: "sm" | "default" | "lg" | "xl" | "full"
  showBackground?: boolean
}

export function EnhancedLayout({
  children,
  header,
  sidebar,
  footer,
  variant,
  spacing,
  className,
  containerSize = "default",
  showBackground = true,
}: EnhancedLayoutProps) {
  return (
    <div className={cn(
      layoutVariants({ variant, spacing }),
      !showBackground && "bg-background",
      className
    )}>
      {/* Global header */}
      {header && (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Container size={containerSize}>
            <div className="flex h-16 items-center justify-between">
              {header}
            </div>
          </Container>
        </header>
      )}
      
      {/* Main content area */}
      <div className={cn(
        "flex-1 flex",
        variant === "sidebar" && "relative"
      )}>
        {/* Sidebar */}
        {sidebar && variant === "sidebar" && (
          <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 lg:border-r lg:bg-background/95 lg:backdrop-blur">
            <div className="flex-1 flex flex-col pt-20 pb-4 overflow-y-auto">
              {sidebar}
            </div>
          </aside>
        )}
        
        {/* Main content */}
        <main className={cn(
          "flex-1 flex flex-col",
          variant === "sidebar" && "lg:pl-64"
        )}>
          <Container 
            size={containerSize} 
            className={cn(
              "flex-1 py-8",
              spacing === "none" && "py-0",
              spacing === "compact" && "py-4",
              spacing === "comfortable" && "py-12"
            )}
          >
            {children}
          </Container>
        </main>
      </div>
      
      {/* Global footer */}
      {footer && (
        <footer className="border-t bg-background/95 backdrop-blur">
          <Container size={containerSize}>
            <div className="py-8">
              {footer}
            </div>
          </Container>
        </footer>
      )}
    </div>
  )
}

// Quick action floating button
export interface QuickActionProps {
  actions: Array<{
    icon: React.ReactNode
    label: string
    onClick: () => void
    disabled?: boolean
  }>
  className?: string
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

export function QuickAction({ actions, className, position = "bottom-right" }: QuickActionProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  }
  
  return (
    <div className={cn(
      "fixed z-50",
      positionClasses[position],
      className
    )}>
      <div className="flex flex-col items-center space-y-2">
        {/* Action buttons */}
        {isOpen && (
          <div className="flex flex-col space-y-2 animate-in slide-in-from-bottom-2">
            {actions.map((action, index) => (
              <EnhancedButton
                key={index}
                variant="floating"
                size="icon-lg"
                onClick={action.onClick}
                disabled={action.disabled}
                className="shadow-enhanced-xl hover:shadow-enhanced-2xl"
                tooltip={action.label}
              >
                {action.icon}
              </EnhancedButton>
            ))}
          </div>
        )}
        
        {/* Main toggle button */}
        <EnhancedButton
          variant="gradient"
          size="icon-xl"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "shadow-enhanced-xl hover:shadow-enhanced-2xl transition-transform",
            isOpen && "rotate-45"
          )}
        >
          {isOpen ? (
            <span className="text-lg">×</span>
          ) : (
            <span className="text-lg">+</span>
          )}
        </EnhancedButton>
      </div>
    </div>
  )
}

// Section component for better content organization
export interface SectionProps {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  spacing?: "none" | "sm" | "default" | "lg"
  variant?: "default" | "card" | "featured"
}

export function Section({
  title,
  description,
  action,
  children,
  className,
  spacing = "default",
  variant = "default",
}: SectionProps) {
  const spacingClasses = {
    none: "space-y-0",
    sm: "space-y-4",
    default: "space-y-6",
    lg: "space-y-8",
  }
  
  const content = (
    <div className={cn(spacingClasses[spacing], className)}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            {title && (
              <h2 className="text-xl font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      
      <div>
        {children}
      </div>
    </div>
  )
  
  if (variant === "card") {
    return (
      <Card className="p-6">
        {content}
      </Card>
    )
  }
  
  if (variant === "featured") {
    return (
      <Card variant="gradient" className="p-8">
        {content}
      </Card>
    )
  }
  
  return content
}

export { layoutVariants }