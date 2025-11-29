export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, initAdmin } from "@/server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin on module load
if (typeof window === 'undefined') {
  initAdmin();
}

export async function POST(req: NextRequest){
  try{
    const { projectId } = await req.json();
    if(!projectId) return NextResponse.json({error:"Missing projectId"}, {status:400});

    const token = req.headers.get("Authorization")?.replace("Bearer ","");
    if(!token) return NextResponse.json({error:"Unauthenticated"}, {status:401});
    
    // Initialize Firebase Admin first - with retry logic
    let auth = getAdminAuth();
    if (!auth) {
      console.log('🔄 [API] Firebase Admin Auth not found, initializing...');
      // Try to initialize
      const { initAdmin } = await import('@/server/firebaseAdmin');
      const app = initAdmin();
      if (app) {
        console.log('✅ [API] Firebase Admin app initialized');
        auth = getAdminAuth();
      }
      if (!auth) {
        console.log('🔄 [API] Trying explicit initialization...');
        // Try one more time with explicit initialization
        const { getAuth } = await import('firebase-admin/auth');
        const { getApps } = await import('firebase-admin/app');
        const apps = getApps();
        console.log(`📊 [API] Found ${apps.length} Firebase Admin apps`);
        if (apps.length > 0) {
          auth = getAuth(apps[0]);
          console.log('✅ [API] Got Auth from existing app');
        }
        if (!auth) {
          console.error('❌ [API] Firebase Admin Auth not available after initialization attempts');
          console.error('❌ [API] Environment check:', {
            hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            nodeEnv: process.env.NODE_ENV
          });
          return NextResponse.json({error:"Service temporarily unavailable - Please try again"}, {status:503});
        }
      }
    }
    console.log('✅ [API] Firebase Admin Auth ready');
    
    const decoded = await auth.verifyIdToken(token).catch((err) => {
      console.error('❌ Token verification failed:', err);
      return null;
    });
    if(!decoded) return NextResponse.json({error:"Invalid token"}, {status:401});
    const uid = decoded.uid;

    let db = getAdminDb();
    if(!db){
      console.log('🔄 [API] Firebase Admin DB not found, initializing...');
      // Try to initialize
      const { initAdmin } = await import('@/server/firebaseAdmin');
      const app = initAdmin();
      if (app) {
        console.log('✅ [API] Firebase Admin app initialized for DB');
        db = getAdminDb();
      }
      if(!db){
        console.log('🔄 [API] Trying explicit DB initialization...');
        // Try one more time with explicit initialization
        const { getFirestore } = await import('firebase-admin/firestore');
        const { getApps } = await import('firebase-admin/app');
        const apps = getApps();
        if (apps.length > 0) {
          db = getFirestore(apps[0]);
          console.log('✅ [API] Got Firestore from existing app');
        }
        if(!db){
          console.error('❌ [API] Firebase Admin DB not available after initialization attempts');
          return NextResponse.json({ error: "Service temporarily unavailable - Please try again" }, { status: 503 });
        }
      }
    }
    console.log('✅ [API] Firebase Admin DB ready');
    
    // Get project
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }
    const projRef = db.collection("projects").doc(projectId);
    const projSnap = await projRef.get();
    if(!projSnap.exists) return NextResponse.json({error:"Project not found"}, {status:404});
    const proj = projSnap.data()!;

    // Get names and logos
    const vcDoc = await db.collection("users").doc(uid).get();
    const founderDoc = await db.collection("users").doc(proj.founderId).get();
    
    const vcData = vcDoc.exists ? vcDoc.data() : {};
    const founderData = founderDoc.exists ? founderDoc.data() : {};
    
    const vcName = vcData?.displayName || vcData?.companyName || vcData?.organizationName || "VC Partner";
    const founderName = founderData?.displayName || founderData?.companyName || "Founder";
    const vcLogo = vcData?.photoURL || vcData?.logo || null;
    const founderLogo = founderData?.photoURL || founderData?.logo || null;

    // Update project status to accepted
    await projRef.update({
      status: 'accepted',
      vcAction: 'accepted',
      acceptedBy: uid,
      acceptedAt: Date.now(),
      updatedAt: Date.now()
    });

    // Create relation
    const rid = `${uid}_${projectId}`;
    await db.collection("relations").doc(rid).set({
      vcId: uid, 
      projectId, 
      founderId: proj.founderId,
      status: "accepted", 
      updatedAt: Date.now(), 
      createdAt: FieldValue.serverTimestamp()
    }, { merge:true });

    // Create deal room - IDEMPOTENT
    const chatId = `deal_${proj.founderId}_${uid}_${projectId}`;
    const chatRef = db.collection("groupChats").doc(chatId);
    const existingChat = await chatRef.get();

    if (!existingChat.exists) {
      // Create new room - PRODUCTION READY
      await chatRef.set({
        name: `${proj.title || proj.name || "Project"} - ${founderName} / ${vcName}`,
        type: "deal",
        status: "active",
        
        founderId: proj.founderId,
        founderName,
        founderLogo,
        
        counterpartId: uid,
        counterpartName: vcName,
        counterpartRole: "vc",
        counterpartLogo: vcLogo,
        
        projectId,
        members: [proj.founderId, uid, 'raftai'],
        memberRoles: {
          [proj.founderId]: 'owner',
          [uid]: 'member',
          'raftai': 'admin'
        },
        memberNames: {
          [proj.founderId]: founderName,
          [uid]: vcName,
          'raftai': 'RaftAI'
        },
        memberAvatars: {
          [proj.founderId]: founderLogo,
          [uid]: vcLogo,
          'raftai': null
        },
        
        settings: {
          filesAllowed: true,
          maxFileSize: 100,
          voiceNotesAllowed: true,
          videoCallAllowed: true
        },
        
        createdAt: Date.now(),
        createdBy: uid,
        lastActivityAt: Date.now(),
        lastMessage: {
          senderId: 'raftai',
          senderName: 'RaftAI',
          text: 'Deal room created!',
          createdAt: Date.now()
        },
        pinnedMessages: [],
        mutedBy: [],
        unreadCount: {
          [proj.founderId]: 0,
          [uid]: 0,
          'raftai': 0
        },
        
        raftaiMemory: {
          decisions: [],
          tasks: [],
          milestones: [],
          notePoints: []
        }
      });

      // System message with complete fields
      await chatRef.collection("messages").add({
        senderId: "raftai",
        senderName: "RaftAI",
        senderAvatar: null,
        type: "system",
        text: `?? RaftAI created this deal room for ${founderName} and ${vcName}. You can now discuss the project, milestones, and next steps!`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

      console.log(`✅ [CHAT] Deal room created: ${chatId}`);
    } else {
      console.log(`✅ [CHAT] Reusing room: ${chatId}`);
    }

    // Create notification for founder
    try {
      const projectName = proj.title || proj.name || 'Your Project';
      await db.collection('notifications').add({
        userId: proj.founderId,
        type: 'project_accepted',
        title: 'VC Accepted Your Pitch! 🎉',
        message: `${vcName} (VC) has accepted your pitch "${projectName}". You can now collaborate in the chat room.`,
        data: {
          projectId,
          projectName,
          roomId: chatId,
          acceptedBy: uid,
          acceptedByName: vcName,
          acceptedByRole: 'vc',
          roomUrl: `/founder/messages?room=${chatId}`,
          founderLogo: founderLogo,
          partnerLogo: vcLogo
        },
        link: `/founder/messages?room=${chatId}`,
        read: false,
        priority: 'high',
        createdAt: FieldValue.serverTimestamp(),
        soundPlayed: false
      });
      console.log(`✅ [VC API] Notification created for founder: ${proj.founderId}`);
    } catch (notificationError: any) {
      console.warn(`⚠️ [VC API] Failed to create notification (non-critical):`, notificationError.message);
      // Don't throw - notification creation is not critical for acceptance
    }

    return NextResponse.json({ 
      success: true,
      chatId,
      roomUrl: `/messages?room=${chatId}`,
      isNew: !existingChat.exists
    });
    
  }catch(e:any){
    console.error('? [API] Error:', e);
    return NextResponse.json({error: String(e?.message||e)}, {status:500});
  }
}

