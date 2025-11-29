# 🎥 Video Optimization Guide for Vercel

## 📋 **Current Video Files:**

Your videos are in `public/` directory:
- `Sequence 01.mp4` (main video)
- `1pagevideo.mp4` (fallback)
- `newvideo.mp4` (fallback)
- `home page video.mp4` (fallback)

---

## ⚠️ **Problem:**

1. **Large File Size**: Videos are likely too large for Vercel (100MB limit)
2. **404 Errors**: Videos not accessible (might be excluded by `.vercelignore`)
3. **Loading Issues**: Videos not optimized for web

---

## ✅ **Solution: Optimize Videos**

### **Step 1: Check Video Sizes**

Run this command to check video file sizes:

```bash
# Windows PowerShell
Get-ChildItem public/*.mp4 | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}

# Or check manually in File Explorer
```

**If videos are > 50MB**, they need optimization.

---

### **Step 2: Optimize Videos**

#### **Option A: Use FFmpeg (Recommended)**

1. **Install FFmpeg**: https://ffmpeg.org/download.html

2. **Optimize each video**:

```bash
# Optimize Sequence 01.mp4 (reduce quality and size)
ffmpeg -i "public/Sequence 01.mp4" -vcodec libx264 -crf 28 -preset slow -vf "scale=1920:-2" -acodec aac -b:a 128k -movflags +faststart "public/Sequence 01-optimized.mp4"

# Optimize 1pagevideo.mp4
ffmpeg -i "public/1pagevideo.mp4" -vcodec libx264 -crf 28 -preset slow -vf "scale=1920:-2" -acodec aac -b:a 128k -movflags +faststart "public/1pagevideo-optimized.mp4"

# Optimize home page video.mp4
ffmpeg -i "public/home page video.mp4" -vcodec libx264 -crf 28 -preset slow -vf "scale=1920:-2" -acodec aac -b:a 128k -movflags +faststart "public/home-page-video-optimized.mp4"
```

**Parameters Explained**:
- `-crf 28`: Quality (lower = better quality, higher = smaller file) - 28 is good balance
- `-preset slow`: Encoding speed (slower = better compression)
- `-vf "scale=1920:-2"`: Resize to max 1920px width (maintains aspect ratio)
- `-b:a 128k`: Audio bitrate
- `-movflags +faststart`: Enables fast start for web playback

#### **Option B: Use Online Tools**

1. **HandBrake**: https://handbrake.fr/
   - Open video
   - Preset: "Web/Google - 1080p30"
   - Click "Start Encode"

2. **CloudConvert**: https://cloudconvert.com/mp4-compressor
   - Upload video
   - Choose compression level
   - Download optimized video

---

### **Step 3: Replace Videos**

After optimization:

1. **Replace original videos** with optimized versions:
   ```bash
   # Backup originals first
   Move-Item "public/Sequence 01.mp4" "public/Sequence 01-original.mp4"
   Move-Item "public/Sequence 01-optimized.mp4" "public/Sequence 01.mp4"
   ```

2. **Or rename optimized videos** to match code:
   - `Sequence 01-optimized.mp4` → `Sequence 01.mp4`
   - `1pagevideo-optimized.mp4` → `1pagevideo.mp4`
   - `home-page-video-optimized.mp4` → `home page video.mp4`

---

### **Step 4: Check .vercelignore**

Make sure videos are NOT excluded:

```bash
# Check .vercelignore
cat .vercelignore
```

**If videos are excluded**, remove them from `.vercelignore`:

```bash
# Edit .vercelignore - remove lines like:
# *.mp4
# public/*.mp4
```

---

### **Step 5: Deploy**

```bash
# Deploy to Vercel
vercel --prod --yes
```

---

## 🎯 **Target File Sizes:**

- **Main video**: < 20MB (ideally 10-15MB)
- **Fallback videos**: < 15MB each
- **Total**: < 50MB for all videos

---

## 📝 **Alternative: Use External Video Hosting**

If videos are still too large:

### **Option 1: YouTube/Vimeo**
- Upload to YouTube/Vimeo (unlisted)
- Embed using iframe
- Free, unlimited size

### **Option 2: Cloudflare Stream**
- Upload videos
- Get embed code
- Pay per video (very affordable)

### **Option 3: AWS S3 + CloudFront**
- Upload to S3
- Use CloudFront CDN
- Pay per GB

---

## ✅ **Quick Fix (Use Background Image Only)**

If you want to skip video optimization for now:

1. **Hide video**, show only background image
2. **Update code** to not load videos
3. **Deploy** - site will work with just image

**I can help you do this if you want!**

---

## 🔍 **Check Current Status:**

Run this to see video sizes:

```powershell
Get-ChildItem public/*.mp4 | Format-Table Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}, LastWriteTime
```

**Tell me the sizes and I'll help optimize!** 🎥

