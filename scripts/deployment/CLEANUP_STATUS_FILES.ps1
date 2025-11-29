# PowerShell script to clean up status/documentation files
# Run this script to remove all temporary status files before committing to Git

Write-Host "🧹 Cleaning up status files..." -ForegroundColor Cyan

# Patterns to match status files
$patterns = @(
    "_*.md",
    "_*.txt",
    "_*.html",
    "✅_*.md",
    "✅_*.txt",
    "✅_*.html",
    "🎉_*.md",
    "🎊_*.md",
    "🚀_*.md",
    "⚡_*.md",
    "⭐_*.md",
    "🌟_*.md",
    "🎯_*.md",
    "🔧_*.md",
    "🔥_*.md",
    "📚_*.md",
    "📖_*.md",
    "🎨_*.md",
    "🎬_*.md",
    "🎥_*.md",
    "🌍_*.md",
    "🌐_*.md",
    "🔒_*.md",
    "🔐_*.md",
    "🔴_*.md",
    "🔵_*.md",
    "🖤_*.md",
    "🗺️_*.md",
    "🤖_*.md",
    "🧪_*.md",
    "🧹_*.md",
    "💬_*.md",
    "💯_*.md",
    "📊_*.md",
    "📋_*.md",
    "📏_*.md",
    "📱_*.md",
    "🔍_*.md",
    "🏆_*.md",
    "🏗️_*.md",
    "🏠_*.md",
    "🏢_*.md",
    "👉_*.md",
    "⬆️_*.md",
    "⚫_*.md",
    "🌑_*.md"
)

$removedCount = 0
$keptFiles = @(
    "README.md",
    "DEPLOYMENT_GUIDE.md",
    "ENV_EXAMPLE.md",
    "CLEANUP_STATUS_FILES.ps1"
)

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $shouldKeep = $false
        foreach ($keepFile in $keptFiles) {
            if ($file.Name -eq $keepFile) {
                $shouldKeep = $true
                break
            }
        }
        
        if (-not $shouldKeep) {
            Write-Host "  Removing: $($file.Name)" -ForegroundColor Yellow
            Remove-Item $file.FullName -Force
            $removedCount++
        }
    }
}

Write-Host "✅ Cleanup complete! Removed $removedCount files." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the remaining files"
Write-Host "  2. Run: git add ."
Write-Host "  3. Run: git commit -m 'Clean codebase for production'"
Write-Host "  4. Follow DEPLOYMENT_GUIDE.md for GitHub setup"




