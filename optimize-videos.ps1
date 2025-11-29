# Video Optimization Script for Vercel Deployment
# This script optimizes videos to be under Vercel's 100MB limit

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VIDEO OPTIMIZATION SCRIPT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if FFmpeg is installed
$ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpegPath) {
    Write-Host "⚠️  FFmpeg not found. Installing via winget..." -ForegroundColor Yellow
    
    # Try to install FFmpeg via winget
    try {
        winget install --id=Gyan.FFmpeg -e --silent --accept-package-agreements --accept-source-agreements
        Write-Host "✅ FFmpeg installed successfully!" -ForegroundColor Green
        Start-Sleep -Seconds 3
    } catch {
        Write-Host "❌ Could not install FFmpeg automatically." -ForegroundColor Red
        Write-Host "Please install FFmpeg manually from: https://ffmpeg.org/download.html" -ForegroundColor Yellow
        Write-Host "Or use online tool: https://cloudconvert.com/mp4-compressor" -ForegroundColor Yellow
        exit 1
    }
}

# Check video files
$videos = @(
    @{Name="home page video.mp4"; TargetSize=10},
    @{Name="Sequence 01.mp4"; TargetSize=15},
    @{Name="1pagevideo.mp4"; TargetSize=15},
    @{Name="newvideo.mp4"; TargetSize=15}
)

Write-Host "Checking video files..." -ForegroundColor Cyan
foreach ($video in $videos) {
    $videoPath = "public\$($video.Name)"
    if (Test-Path $videoPath) {
        $sizeMB = [math]::Round((Get-Item $videoPath).Length / 1MB, 2)
        Write-Host "  $($video.Name): $sizeMB MB" -ForegroundColor White
        
        if ($sizeMB -gt $video.TargetSize) {
            Write-Host "    → Needs optimization (target: < $($video.TargetSize) MB)" -ForegroundColor Yellow
            
            $outputName = $video.Name -replace "\.mp4$", "-optimized.mp4"
            $outputPath = "public\$outputName"
            
            Write-Host "    → Optimizing..." -ForegroundColor Cyan
            
            # Optimize video
            $crf = if ($sizeMB -gt 100) { 30 } elseif ($sizeMB -gt 50) { 28 } else { 26 }
            
            & ffmpeg -i "`"$videoPath`"" `
                -vcodec libx264 `
                -crf $crf `
                -preset slow `
                -vf "scale=1920:-2" `
                -acodec aac `
                -b:a 96k `
                -movflags +faststart `
                -y `
                "`"$outputPath`"" 2>&1 | Out-Null
            
            if (Test-Path $outputPath) {
                $newSizeMB = [math]::Round((Get-Item $outputPath).Length / 1MB, 2)
                Write-Host "    ✅ Optimized: $newSizeMB MB" -ForegroundColor Green
                
                if ($newSizeMB -lt $video.TargetSize) {
                    # Backup original
                    $backupPath = $videoPath -replace "\.mp4$", "-backup.mp4"
                    Move-Item -Path $videoPath -Destination $backupPath -Force
                    
                    # Use optimized
                    Move-Item -Path $outputPath -Destination $videoPath -Force
                    Write-Host "    ✅ Replaced original with optimized version" -ForegroundColor Green
                } else {
                    Write-Host "    ⚠️  Still too large, keeping original" -ForegroundColor Yellow
                    Remove-Item $outputPath -Force
                }
            }
        } else {
            Write-Host "    ✅ Already optimized" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "OPTIMIZATION COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Show final sizes
Write-Host ""
Write-Host "Final video sizes:" -ForegroundColor Cyan
Get-ChildItem public/*.mp4 -Exclude *-backup.mp4 | ForEach-Object {
    $sizeMB = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  $($_.Name): $sizeMB MB" -ForegroundColor White
}

$totalSize = (Get-ChildItem public/*.mp4 -Exclude *-backup.mp4 | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "Total size: $([math]::Round($totalSize, 2)) MB" -ForegroundColor $(if ($totalSize -lt 40) { "Green" } else { "Yellow" })

if ($totalSize -lt 40) {
    Write-Host "✅ Ready for deployment!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Still too large. Consider using only one video." -ForegroundColor Yellow
}

