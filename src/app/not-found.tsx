import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
          <h2 className="mt-4 text-3xl font-bold">Page not found</h2>
          <p className="mt-2 text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Here are some helpful links:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link 
              href="/dashboard" 
              className="text-sm text-primary hover:underline"
            >
              Dashboard
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="/tasks" 
              className="text-sm text-primary hover:underline"
            >
              Tasks
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="/goals" 
              className="text-sm text-primary hover:underline"
            >
              Goals
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="/settings" 
              className="text-sm text-primary hover:underline"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}