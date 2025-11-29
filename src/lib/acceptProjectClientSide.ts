/**
 * Client-side project acceptance and chat room creation
 * Works for all roles without needing Firebase Admin SDK
 */

import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  Timestamp 
} from '@/lib/firebase.client';

export interface AcceptProjectOptions {
  projectId: string;
  userId: string;
  userEmail: string;
  roleType: 'vc' | 'exchange' | 'ido' | 'influencer' | 'marketing' | 'agency';
  orgId?: string;
}

export interface AcceptProjectResult {
  success: boolean;
  chatId?: string;
  roomUrl?: string;
  error?: string;
}

export async function acceptProjectClientSide(
  options: AcceptProjectOptions
): Promise<AcceptProjectResult> {
  const { projectId, userId, userEmail, roleType, orgId } = options;
  const database = db;
  if (!database) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    console.log(`✅ [CLIENT-ACCEPT] Starting acceptance for ${roleType}:`, projectId);
    
    // 1. Get the project data
    const projectRef = doc(database, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectSnap.data();
    const founderId = projectData.founderId;
    
    if (!founderId) {
      throw new Error('Project missing founder information');
    }
    
    console.log(`✅ [CLIENT-ACCEPT] Project found:`, projectData.title || projectData.name);
    
    // 2. Update project status
    await updateDoc(projectRef, {
      [`${roleType}Action`]: 'accepted',
      [`${roleType}ActionAt`]: Timestamp.now(),
      [`${roleType}ActionBy`]: userId,
      ...(orgId && { [`${roleType}OrgId`]: orgId }),
      updatedAt: Timestamp.now(),
      status: 'accepted'
    });
    
    console.log(`✅ [CLIENT-ACCEPT] Project status updated`);
    
    // 3. Get user profiles for chat room
    const userDoc = await getDoc(doc(database, 'users', userId));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const founderDoc = await getDoc(doc(database, 'users', founderId));
    const founderData = founderDoc.exists() ? founderDoc.data() : {};
    
    // Determine names and logos
    const yourName = userData.displayName || 
                     userData.companyName || 
                     userData.organizationName || 
                     userData.company_name ||
                     userEmail?.split('@')[0] ||
                     `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Partner`;
    
    const founderName = founderData.displayName || 
                        founderData.companyName || 
                        founderData.company_name ||
                        projectData.founderName || 
                        'Founder';
    
    // Get logos with fallback handling
    const yourLogo = userData.photoURL || 
                     userData.logo || 
                     userData.logoUrl || 
                     userData.avatar ||
                     userData.profilePhoto ||
                     null;
    const founderLogo = founderData.photoURL || 
                        founderData.logo || 
                        founderData.logoUrl || 
                        founderData.avatar ||
                        founderData.profilePhoto ||
                        null;
    
    // Validate URLs - only use HTTPS URLs to prevent 404 errors
    const validateUrl = (url: any): string | null => {
      if (!url) return null;
      const urlStr = typeof url === 'string' ? url : String(url);
      if (urlStr.startsWith('https://') || urlStr.startsWith('http://')) {
        return urlStr;
      }
      return null; // Don't use relative paths or invalid URLs
    };
    
    const validatedYourLogo = validateUrl(yourLogo);
    const validatedFounderLogo = validateUrl(founderLogo);
    
    console.log(`✅ [CLIENT-ACCEPT] Names - You: ${yourName}, Founder: ${founderName}`);
    
    // 4. Create unique chat room ID
    const chatId = `deal_${founderId}_${userId}_${projectId}`;
    const chatRef = doc(database, 'groupChats', chatId);
    
    // Check if chat already exists
    const existingChat = await getDoc(chatRef);
    
    if (!existingChat.exists()) {
      console.log(`✅ [CLIENT-ACCEPT] Creating new chat room: ${chatId}`);
      
      // Determine room type and welcome message based on role
      const roomConfig = getRoomConfig(roleType, founderName, yourName);
      
      // Create chat room document
      await setDoc(chatRef, {
        name: `${projectData.title || projectData.name || 'Project'} - ${founderName} / ${yourName}`,
        type: roomConfig.type,
        status: 'active',
        
        // Founder info
        founderId,
        founderName,
        founderLogo: validatedFounderLogo,
        
        // Partner info
        counterpartId: userId,
        counterpartName: yourName,
        counterpartRole: roleType,
        counterpartLogo: validatedYourLogo,
        
        // Project reference
        projectId,
        projectName: projectData.title || projectData.name,
        
        // Members
        members: [founderId, userId, 'raftai'],
        memberRoles: {
          [founderId]: 'owner',
          [userId]: 'member',
          'raftai': 'admin'
        },
        memberNames: {
          [founderId]: founderName,
          [userId]: yourName,
          'raftai': 'RaftAI'
        },
        memberAvatars: {
          [founderId]: validatedFounderLogo,
          [userId]: validatedYourLogo,
          'raftai': null
        },
        
        // Settings
        settings: {
          filesAllowed: true,
          maxFileSize: 100, // MB
          voiceNotesAllowed: true,
          videoCallAllowed: true
        },
        
        // Timestamps
        createdAt: Date.now(),
        createdBy: userId,
        lastActivityAt: Date.now(),
        
        // Last message
        lastMessage: {
          senderId: 'raftai',
          senderName: 'RaftAI',
          text: roomConfig.welcomeMessage,
          createdAt: Date.now()
        },
        
        // Unread counts
        unreadCount: {
          [founderId]: 0,
          [userId]: 0,
          'raftai': 0
        },
        
        // Other
        pinnedMessages: [],
        mutedBy: [],
        
        // RaftAI memory
        raftaiMemory: {
          decisions: [],
          tasks: [],
          milestones: [],
          notePoints: []
        }
      });
      
      console.log(`✅ [CLIENT-ACCEPT] Chat room document created`);
      
      // Add welcome message
      const messagesRef = collection(database, 'groupChats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId: 'raftai',
        senderName: 'RaftAI',
        senderAvatar: null,
        type: 'system',
        text: roomConfig.welcomeMessage,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });
      
      console.log(`✅ [CLIENT-ACCEPT] Welcome message added`);
    } else {
      console.log(`✅ [CLIENT-ACCEPT] Chat room already exists: ${chatId}`);
    }
    
    // 5. Create notification for founder
    try {
      const notificationsRef = collection(database, 'notifications');
      const roleDisplayNames: Record<string, string> = {
        vc: 'VC',
        exchange: 'Exchange',
        ido: 'IDO Platform',
        influencer: 'Influencer',
        marketing: 'Marketing Agency',
        agency: 'Agency'
      };
      
      const roleDisplayName = roleDisplayNames[roleType] || roleType.toUpperCase();
      const projectName = projectData.title || projectData.name || 'Your Project';
      
      // Get founder logo for notification
      const founderLogo = validatedFounderLogo || null;
      
      await addDoc(notificationsRef, {
        userId: founderId,
        type: 'project_accepted',
        title: `${roleDisplayName} Accepted Your Pitch! 🎉`,
        message: `${yourName} (${roleDisplayName}) has accepted your pitch "${projectName}". You can now collaborate in the chat room.`,
        data: {
          projectId,
          projectName,
          roomId: chatId,
          acceptedBy: userId,
          acceptedByName: yourName,
          acceptedByRole: roleType,
          roomUrl: `/messages?room=${chatId}`,
          founderLogo: founderLogo, // Include founder logo in notification
          partnerLogo: validatedYourLogo // Include partner logo
        },
        link: `/messages?room=${chatId}`,
        read: false,
        priority: 'high',
        createdAt: Timestamp.now(),
        soundPlayed: false,
        // Include founder logo for display
        founderLogo: founderLogo
      });
      
      console.log(`✅ [CLIENT-ACCEPT] Notification created for founder`);
    } catch (notificationError: any) {
      console.warn(`⚠️ [CLIENT-ACCEPT] Failed to create notification (non-critical):`, notificationError.message);
      // Don't throw - notification creation is not critical for acceptance
    }
    
    // 6. Return success with room URL
    const roomUrl = `/messages?room=${chatId}`;
    
    console.log(`✅ [CLIENT-ACCEPT] Success! Redirecting to: ${roomUrl}`);
    
    return {
      success: true,
      chatId,
      roomUrl
    };
    
  } catch (error: any) {
    console.error(`❌ [CLIENT-ACCEPT] Error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to accept project'
    };
  }
}

/**
 * Get room configuration based on role type
 */
function getRoomConfig(
  roleType: string,
  founderName: string,
  partnerName: string
) {
  const configs = {
    vc: {
      type: 'deal',
      welcomeMessage: `🤖 RaftAI initialized this deal room for ${founderName} and ${partnerName}. I'll be monitoring this conversation and providing insights to help close this deal!`
    },
    exchange: {
      type: 'listing',
      welcomeMessage: `🎉 RaftAI created this listing room for ${founderName} and ${partnerName}. Discuss your token listing details and requirements here!`
    },
    ido: {
      type: 'ido',
      welcomeMessage: `🚀 RaftAI created this IDO room for ${founderName} and ${partnerName}. Plan your token sale strategy and timeline here!`
    },
    influencer: {
      type: 'campaign',
      welcomeMessage: `📢 RaftAI created this campaign room for ${founderName} and ${partnerName}. Plan your marketing campaign and content strategy here!`
    },
    marketing: {
      type: 'campaign',
      welcomeMessage: `🎯 RaftAI created this collaboration room for ${founderName} and ${partnerName}. Let's build an amazing marketing campaign together!`
    },
    agency: {
      type: 'campaign',
      welcomeMessage: `🎯 RaftAI created this collaboration room for ${founderName} and ${partnerName}. Let's build an amazing campaign together!`
    }
  };
  
  return configs[roleType as keyof typeof configs] || configs.vc;
}

