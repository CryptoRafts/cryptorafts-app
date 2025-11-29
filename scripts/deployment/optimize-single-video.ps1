# Optimize only the smallest video for deployment
$videoPath = "public\home page video.mp4"
$outputPath = "public\home-page-optimized.mp4"

Write-Host "Optimizing smallest video: home page video.mp4 (20.24 MB)" -ForegroundColor Cyan

# Try to find FFmpeg
$ffmpegPaths = @(
    "C:\ffmpeg\bin\ffmpeg.exe",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-*\bin\ffmpeg.exe",
    (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
)

$ffmpeg = $null
foreach ($path in $ffmpegPaths) {
    if ($path -and (Test-Path $path)) {
        $ffmpeg = $path
        break
    }
}

# Try to find via Get-ChildItem
if (-not $ffmpeg) {
    $found = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "ffmpeg.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $ffmpeg = $found.FullName
    }
}

if (-not $ffmpeg) {
    Write-Host "FFmpeg not found. Using background image only." -ForegroundColor Yellow
    Write-Host "Videos will be excluded from deployment." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found FFmpeg at: $ffmpeg" -ForegroundColor Green
Write-Host "Optimizing video..." -ForegroundColor Cyan

# Optimize with aggressive compression
& "$ffmpeg" -i "`"$videoPath`"" `
    -vcodec libx264 `
    -crf 30 `
    -preset medium `
    -vf "scale=1280:-2" `
    -acodec aac `
    -b:a 64k `
    -movflags +faststart `
    -y `
    "`"$outputPath`"" 2>&1 | Out-Null

if (Test-Path $outputPath) {
    $originalSize = [math]::Round((Get-Item $videoPath).Length / 1MB, 2)
    $newSize = [math]::Round((Get-Item $outputPath).Length / 1MB, 2)
    
    Write-Host "Original: $originalSize MB" -ForegroundColor White
    Write-Host "Optimized: $newSize MB" -ForegroundColor $(if ($newSize -lt 15) { "Green" } else { "Yellow" })
    
    if ($newSize -lt 15) {
        # Backup and replace
        Move-Item -Path $videoPath -Destination "$videoPath.backup" -Force
        Move-Item -Path $outputPath -Destination $videoPath -Force
        Write-Host "✅ Video optimized and replaced!" -ForegroundColor Green
        Write-Host "✅ Ready for deployment!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Still too large, keeping original" -ForegroundColor Yellow
        Remove-Item $outputPath -Force
    }
} else {
    Write-Host "❌ Optimization failed" -ForegroundColor Red
}

