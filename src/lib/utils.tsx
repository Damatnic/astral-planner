import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { logger } from "@/lib/logger"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric", 
    year: "numeric",
    ...options,
  }).format(new Date(date))
}

export function formatTime(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(new Date(date))
}

export function formatDateTime(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric", 
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return "just now"
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`
  }
  
  return formatDate(targetDate, { month: "short", day: "numeric" })
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  }
  
  // Fallback for older browsers
  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.style.position = "absolute"
  textArea.style.left = "-999999px"
  
  document.body.prepend(textArea)
  textArea.select()
  
  try {
    document.execCommand("copy")
  } catch (error) {
    logger.error('Failed to copy text to clipboard', error as Error);
    throw new Error("Failed to copy to clipboard")
  } finally {
    textArea.remove()
  }
  
  return Promise.resolve()
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

// Color utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => {
    const hex = x.toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }).join("")
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

export function range(start: number, end: number, step = 1): number[] {
  const result = []
  for (let i = start; i < end; i += step) {
    result.push(i)
  }
  return result
}

// Local storage utilities with error handling
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    logger.warn('Error reading from localStorage', {
      component: 'utils',
      action: 'getFromStorage',
      metadata: { key }
    });
    return defaultValue
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    logger.error('Error writing to localStorage', {
      component: 'utils',
      action: 'setToStorage',
      metadata: { key }
    }, error as Error);
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(key)
  } catch (error) {
    logger.error('Error removing from localStorage', {
      component: 'utils',
      action: 'removeFromStorage',
      metadata: { key }
    }, error as Error);
  }
}