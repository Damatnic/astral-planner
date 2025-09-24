import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md text-center px-4">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">Page not found</h2>
        <p className="mb-8">The page you are looking for does not exist.</p>
        <Link 
          href="/dashboard" 
          className="text-blue-600 hover:underline"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}