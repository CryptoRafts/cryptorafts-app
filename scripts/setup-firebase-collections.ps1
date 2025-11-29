# Setup Firebase Collections for Blog System
# Creates required collections and indexes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Firebase Collections Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Required Collections:" -ForegroundColor Yellow
Write-Host "  1. blog_posts (already exists)" -ForegroundColor Gray
Write-Host "  2. scheduled_posts (NEW)" -ForegroundColor Green
Write-Host "  3. blog_team_members (NEW)" -ForegroundColor Green
Write-Host ""

Write-Host "Please create these collections in Firebase Console:" -ForegroundColor Yellow
Write-Host "  https://console.firebase.google.com/project/cryptorafts-b9067/firestore" -ForegroundColor Cyan
Write-Host ""

Write-Host "Collection Details:" -ForegroundColor Yellow
Write-Host ""
Write-Host "scheduled_posts:" -ForegroundColor Green
Write-Host "  - Stores scheduled posts temporarily" -ForegroundColor Gray
Write-Host "  - Auto-deleted when published" -ForegroundColor Gray
Write-Host "  - Fields: title, content, scheduledDate, status, metadata" -ForegroundColor Gray
Write-Host ""
Write-Host "blog_team_members:" -ForegroundColor Green
Write-Host "  - Stores team members for blog department" -ForegroundColor Gray
Write-Host "  - Fields: email, department, role, status, permissions" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Go to Firebase Console" -ForegroundColor Gray
Write-Host "  2. Create 'scheduled_posts' collection" -ForegroundColor Gray
Write-Host "  3. Create 'blog_team_members' collection" -ForegroundColor Gray
Write-Host "  4. Update Firestore security rules (see DEPLOY_VERCEL_FIREBASE.md)" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Setup instructions complete!" -ForegroundColor Green

