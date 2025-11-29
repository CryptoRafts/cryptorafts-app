# Optimize Sequence 01.mp4 for deployment
$videoPath = "public\Sequence 01.mp4"
$outputPath = "public\Sequence-01-optimized.mp4"

Write-Host "Optimizing Sequence 01.mp4..." -ForegroundColor Cyan

# Find FFmpeg
$ffmpeg = "C:\Users\$env:USERNAME\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe"

if (-not (Test-Path $ffmpeg)) {
    $found = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "ffmpeg.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $ffmpeg = $found.FullName
    } else {
        Write-Host "FFmpeg not found!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Found FFmpeg at: $ffmpeg" -ForegroundColor Green
Write-Host "Optimizing video (this may take a few minutes)..." -ForegroundColor Cyan

# Optimize with good quality/size balance
& "$ffmpeg" -i "`"$videoPath`"" `
    -vcodec libx264 `
    -crf 28 `
    -preset medium `
    -vf "scale=1920:-2" `
    -acodec aac `
    -b:a 96k `
    -movflags +faststart `
    -y `
    "`"$outputPath`"" 2>&1 | Out-Null

if (Test-Path $outputPath) {
    $originalSize = [math]::Round((Get-Item $videoPath).Length / 1MB, 2)
    $newSize = [math]::Round((Get-Item $outputPath).Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "Original: $originalSize MB" -ForegroundColor White
    Write-Host "Optimized: $newSize MB" -ForegroundColor $(if ($newSize -lt 15) { "Green" } else { "Yellow" })
    
    if ($newSize -lt 15) {
        # Backup and replace
        Move-Item -Path $videoPath -Destination "$videoPath.backup" -Force
        Move-Item -Path $outputPath -Destination $videoPath -Force
        Write-Host "✅ Video optimized and replaced!" -ForegroundColor Green
        Write-Host "✅ Ready for deployment!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Still too large ($newSize MB), trying more aggressive compression..." -ForegroundColor Yellow
        
        # Try more aggressive compression
        $outputPath2 = "public\Sequence-01-optimized2.mp4"
        & "$ffmpeg" -i "`"$videoPath`"" `
            -vcodec libx264 `
            -crf 30 `
            -preset medium `
            -vf "scale=1280:-2" `
            -acodec aac `
            -b:a 64k `
            -movflags +faststart `
            -y `
            "`"$outputPath2`"" 2>&1 | Out-Null
        
        if (Test-Path $outputPath2) {
            $newSize2 = [math]::Round((Get-Item $outputPath2).Length / 1MB, 2)
            Write-Host "Second attempt: $newSize2 MB" -ForegroundColor $(if ($newSize2 -lt 15) { "Green" } else { "Yellow" })
            
            if ($newSize2 -lt 15) {
                Move-Item -Path $videoPath -Destination "$videoPath.backup" -Force
                Move-Item -Path $outputPath2 -Destination $videoPath -Force
                Remove-Item $outputPath -Force -ErrorAction SilentlyContinue
                Write-Host "✅ Video optimized and replaced!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Still too large, keeping original" -ForegroundColor Yellow
                Remove-Item $outputPath, $outputPath2 -Force -ErrorAction SilentlyContinue
            }
        }
    }
} else {
    Write-Host "❌ Optimization failed" -ForegroundColor Red
}

