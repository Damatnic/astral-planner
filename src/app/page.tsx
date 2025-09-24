export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          🌟 Ultimate Digital Planner
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          The world's most advanced productivity platform
        </p>
        <div className="bg-white rounded-2xl shadow-xl p-12 space-y-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">
            🚀 Deployment Successful!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="text-4xl">🎯</div>
              <h3 className="text-xl font-semibold">Smart Goals</h3>
              <p className="text-gray-600">AI-powered goal tracking and achievement</p>
            </div>
            <div className="space-y-4">
              <div className="text-4xl">📅</div>
              <h3 className="text-xl font-semibold">Intelligent Calendar</h3>
              <p className="text-gray-600">Automated scheduling and time blocking</p>
            </div>
            <div className="space-y-4">
              <div className="text-4xl">💎</div>
              <h3 className="text-xl font-semibold">Habit Formation</h3>
              <p className="text-gray-600">Science-based habit tracking system</p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-lg font-medium text-green-600 mb-4">
              ✅ Production deployment active on Vercel
            </p>
            <p className="text-sm text-gray-500">
              Powered by Next.js 15 • TypeScript • Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}