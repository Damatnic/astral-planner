# Fix all 3-parameter logger calls to 2-parameter
# Converts: logger.error('message', {}, error) → logger.error('message', error)
# Converts: logger.error('message', { metadata }, error) → logger.error('message', error)

$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx

$pattern = '(logger|authLogger|apiLogger|performanceLogger)\.(error|warn|info|debug)\s*\([^,]+,\s*\{[^}]*\},\s*(error[^)]*)\)'
$replacement = '$1.$2($3, $4)'

$updated = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix pattern: logger.method('message', {anything}, error)
    $content = $content -replace '((?:logger|authLogger|apiLogger|performanceLogger)\.(?:error|warn|info|debug))\s*\(([^,]+),\s*\{[^}]*\},\s*(error[^)]*)\)', '$1($2, $3)'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -NoNewline
        Write-Host "✅ Fixed: $($file.FullName)" -ForegroundColor Green
        $updated++
    }
}

Write-Host ""
Write-Host "Fixed $updated files" -ForegroundColor Cyan
