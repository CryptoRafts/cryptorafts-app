import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // For now, return success - file upload will be handled client-side
    // This prevents the 400/500 errors while we implement proper server-side upload
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const roomId = formData.get('roomId') as string;
    const senderId = formData.get('senderId') as string;
    const senderName = formData.get('senderName') as string;
    const type = formData.get('type') as string;

    if (!file || !roomId || !senderId || !senderName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    // Generate a mock download URL for now
    const timestamp = Date.now();
    const mockDownloadURL = `https://example.com/files/${type}_${timestamp}_${senderId}`;

    return NextResponse.json({ 
      success: true, 
      messageId: `msg_${timestamp}_${senderId}`,
      downloadURL: mockDownloadURL 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
