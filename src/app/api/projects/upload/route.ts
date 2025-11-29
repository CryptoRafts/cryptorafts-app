export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";
import { requireUser } from "@/app/api/_utils";
import { getStorage } from "firebase-admin/storage";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUser(req);
    if (!uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const projectId = formData.get('projectId') as string;
    const fileType = formData.get('fileType') as string;
    const file = formData.get('file') as File;

    if (!projectId || !fileType || !file) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['pitch.pdf', 'whitepaper.pdf', 'model.xlsx', 'auditReport'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Check if user owns the project
    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const projectDoc = await db.doc(`projects/${projectId}`).get();
    
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();
    if (projectData?.founderId !== uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Upload file to Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    
    const fileName = `${fileType}_${Date.now()}_${file.name}`;
    const filePath = `projects/${projectId}/${fileName}`;
    const fileRef = bucket.file(filePath);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: uid,
          projectId,
          fileType,
          uploadedAt: Date.now().toString()
        }
      }
    });

    // Generate signed URL (valid for 1 year)
    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      version: 'v4'
    });

    // Create file metadata
    const fileMetadata = {
      fileName: file.name,
      fileType,
      fileSize: file.size,
      mimeType: file.type,
      storagePath: filePath,
      downloadURL: signedUrl,
      uploadedAt: Date.now(),
      uploadedBy: uid,
      version: 1,
      checksum: '', // Would calculate actual checksum in production
      ndaRequired: fileType === 'auditReport'
    };

    // Update project with file reference
    await db.doc(`projects/${projectId}`).update({
      [`files.${fileType}`]: fileMetadata,
      updatedAt: Date.now()
    });

    // Create audit log
    await db.collection('audit_logs').add({
      type: 'file_upload',
      projectId,
      userId: uid,
      fileType,
      fileName: file.name,
      fileSize: file.size,
      timestamp: Date.now()
    });

    return NextResponse.json({
      success: true,
      fileMetadata,
      message: "File uploaded successfully"
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

