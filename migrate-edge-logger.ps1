# Edge Logger Migration Script
# Automatically migrates all files from Winston logger to Edge Logger

$files = @(
    "src\lib\security\secure-error-handler.ts",
    "src\lib\security\data-encryption.ts",
    "src\lib\security\comprehensive-security.ts",
    "src\lib\security\api-security.ts",
    "src\lib\realtime\pusher-server.ts",
    "src\lib\realtime\pusher-client.ts",
    "src\lib\realtime\broadcaster.ts",
    "src\lib\pusher\server.ts",
    "src\lib\performance-monitor.ts",
    "src\lib\performance\web-vitals.ts",
    "src\lib\performance\preloader.ts",
    "src\lib\performance\catalyst-dashboard.ts",
    "src\lib\monitoring\sentry.ts",
    "src\lib\monitoring\performance.ts",
    "src\lib\image\optimization.ts",
    "src\lib\fonts\dynamic-fonts.ts",
    "src\lib\email\resend.ts",
    "src\lib\cache\redis.ts",
    "src\lib\seo\performance.ts",
    "src\hooks\use-user-preferences.tsx",
    "src\hooks\use-onboarding.ts",
    "src\hooks\use-auth.ts",
    "src\components\seo\SEODashboard.tsx",
    "src\components\pwa\InstallPrompt.tsx",
    "src\components\PerformanceMonitor.tsx",
    "src\components\providers\auth-provider.tsx",
    "src\components\providers\pwa-provider.tsx",
    "src\components\error\ErrorBoundary.tsx",
    "src\app\sitemap.xml\route.ts",
    "src\app\templates\TemplatesClient.tsx",
    "src\app\settings\SettingsClient.tsx",
    "src\app\goals\[id]\GoalDetailClient.tsx",
    "src\app\admin\AdminClient.tsx",
    "src\app\habits\HabitsClientFixed.tsx"
)

$replacements = @{
    "import Logger from '@/lib/logger'" = "import { Logger } from '@/lib/logger/edge'"
    "import { logger } from '@/lib/logger'" = "import { Logger as logger } from '@/lib/logger/edge'"
    "import { authLogger } from '@/lib/logger'" = "import { Logger as authLogger } from '@/lib/logger/edge'"
    "import { apiLogger } from '@/lib/logger'" = "import { Logger as apiLogger } from '@/lib/logger/edge'"
    "import { performanceLogger } from '@/lib/logger'" = "import { Logger as performanceLogger } from '@/lib/logger/edge'"
}

$updated = 0
$errors = 0

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        try {
            $content = Get-Content $fullPath -Raw
            $originalContent = $content
            
            foreach ($search in $replacements.Keys) {
                $replace = $replacements[$search]
                $content = $content -replace [regex]::Escape($search), $replace
            }
            
            if ($content -ne $originalContent) {
                Set-Content $fullPath $content -NoNewline
                Write-Host "✅ Updated: $file" -ForegroundColor Green
                $updated++
            } else {
                Write-Host "⏭️  Skipped: $file (no changes needed)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Error: $file - $_" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Cyan
Write-Host "Updated: $updated files" -ForegroundColor Green
Write-Host "Errors: $errors files" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Cyan
