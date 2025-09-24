export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Ultimate Digital Planner
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Test Deployment Successful!
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              System Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Next.js 15</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">TypeScript</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tailwind CSS</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Vercel Deployment</span>
                <span className="text-green-600 font-medium">✓ Success</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Build Time: {new Date().toISOString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}