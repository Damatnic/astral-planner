import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "ghost" | "filled"
  inputSize?: "sm" | "md" | "lg"
  error?: boolean
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = "text", 
    variant = "default", 
    inputSize = "md", 
    error = false,
    helperText,
    leftIcon,
    rightIcon,
    disabled,
    ...props 
  }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              {
                // Variants
                "border-input bg-background": variant === "default",
                "border-transparent bg-transparent": variant === "ghost",
                "border-input bg-muted": variant === "filled",
                
                // Sizes
                "h-8 px-2 text-xs": inputSize === "sm",
                "h-10 px-3 text-sm": inputSize === "md",
                "h-12 px-4 text-base": inputSize === "lg",
                
                // Error state
                "border-destructive focus-visible:ring-destructive": error,
                
                // Icon spacing
                "pl-10": leftIcon,
                "pr-10": rightIcon,
              },
              className
            )}
            disabled={disabled}
            ref={ref}
            aria-invalid={error}
            aria-describedby={helperText ? `${props.id}-helper` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {helperText && (
          <p 
            id={`${props.id}-helper`}
            className={cn(
              "mt-1 text-xs",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Textarea component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "ghost" | "filled"
  error?: boolean
  helperText?: string
  resize?: "none" | "vertical" | "horizontal" | "both"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    variant = "default",
    error = false,
    helperText,
    resize = "vertical",
    disabled,
    ...props
  }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            {
              // Variants
              "border-input bg-background": variant === "default",
              "border-transparent bg-transparent": variant === "ghost",
              "border-input bg-muted": variant === "filled",
              
              // Error state
              "border-destructive focus-visible:ring-destructive": error,
              
              // Resize options
              "resize-none": resize === "none",
              "resize-y": resize === "vertical",
              "resize-x": resize === "horizontal",
              "resize": resize === "both",
            },
            className
          )}
          disabled={disabled}
          ref={ref}
          aria-invalid={error}
          aria-describedby={helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
        {helperText && (
          <p 
            id={`${props.id}-helper`}
            className={cn(
              "mt-1 text-xs",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Input, Textarea }