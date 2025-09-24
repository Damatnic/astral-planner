// Global type declarations
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId?: string | Date | Record<string, any>,
      config?: Record<string, any>
    ) => void;
    va?: (
      command: 'track',
      event: string,
      data?: Record<string, any>
    ) => void;
  }
}

export {};