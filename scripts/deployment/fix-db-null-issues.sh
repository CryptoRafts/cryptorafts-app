#!/bin/bash
# Fix all database null check issues in API routes

files=$(grep -r "const db = getAdminDb()" src/app/api --files-with-matches)

for file in $files; do
    echo "Fixing: $file"
    # Add null check after getAdminDb() if not already present
    sed -i '/const db = getAdminDb();/a\    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });' "$file"
done

