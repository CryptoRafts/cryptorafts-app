/**
 * 🎯 CHAT SYSTEM CONFIGURATION
 * 
 * This file contains ALL customizable settings for the chat system.
 * Modify these values to customize behavior without touching core code.
 */

export const CHAT_CONFIG = {
  // ==========================================
  // CALL SETTINGS
  // ==========================================
  calls: {
    // Maximum call duration in minutes (default: 30)
    maxDuration: 30,
    
    // Auto-decline incoming calls after X seconds (default: 30)
    incomingCallTimeout: 30,
    
    // Enable/disable call features
    voiceCallsEnabled: true,
    videoCallsEnabled: true,
    
    // Call notification settings
    playRingingSound: true, // Play sound for incoming calls
    showBrowserNotification: true, // Show browser notifications
    vibrate: false, // Vibrate on mobile (if supported)
    
    // Video call quality presets - OPTIMIZED for smooth streaming
    videoResolution: {
      width: 3840,  // 4K Ultra HD
      height: 2160,
      frameRate: 60  // Increased to 60fps for smoother video
    },
    
    // Quality presets for user selection - OPTIMIZED for smooth 4K/1080p streaming
    qualityPresets: {
      '4K': { width: 3840, height: 2160, frameRate: 60, bitrate: 12000000 },  // 12 Mbps @ 60fps for ultra-smooth 4K
      '1080p': { width: 1920, height: 1080, frameRate: 60, bitrate: 6000000 }, // 6 Mbps @ 60fps for smooth Full HD
      '720p': { width: 1280, height: 720, frameRate: 60, bitrate: 3500000 },  // 3.5 Mbps @ 60fps for smooth HD
      '480p': { width: 854, height: 480, frameRate: 30, bitrate: 1500000 },   // 1.5 Mbps @ 30fps
      'auto': { width: 1920, height: 1080, frameRate: 60, bitrate: 0 }       // Adaptive with 60fps
    },
    
    // Default quality setting
    defaultQuality: '4K', // 4K Ultra HD by default for perfect quality
    
    // Audio settings
    audio: {
      echoCancellation: true, // Prevent echo/feedback
      noiseSuppression: true, // Remove background noise
      autoGainControl: true, // Auto-adjust volume
      sampleRate: 48000, // Audio quality (Hz)
    },
    
    // TURN/STUN servers for WebRTC
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
  },

  // ==========================================
  // MESSAGE SETTINGS
  // ==========================================
  messages: {
    // Maximum message length in characters (default: 5000)
    maxLength: 5000,
    
    // Enable/disable message features
    reactionsEnabled: true,
    editingEnabled: true,
    deletingEnabled: true,
    pinningEnabled: true,
    replyingEnabled: true,
    forwardingEnabled: true,
    
    // Auto-scroll behavior
    autoScrollToBottom: true,
    autoScrollThreshold: 100, // px from bottom to auto-scroll
    
    // Message display
    showTimestamps: true,
    showReadReceipts: true,
    showTypingIndicators: true,
    
    // System messages
    showCallStartMessages: true,
    showCallEndMessages: true,
    showMemberJoinMessages: true,
    showMemberLeaveMessages: true,
  },

  // ==========================================
  // FILE UPLOAD SETTINGS
  // ==========================================
  files: {
    // Maximum file size in MB (default: 10MB)
    maxFileSize: 10,
    
    // Enable/disable file types
    imagesEnabled: true,
    videosEnabled: true,
    documentsEnabled: true,
    voiceNotesEnabled: true,
    
    // Allowed file types (MIME types)
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedDocumentTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ],
    
    // Voice note settings
    voiceNote: {
      maxDuration: 300, // seconds (5 minutes)
      format: 'audio/webm',
      bitrate: 128000 // 128kbps
    },
    
    // Preview settings
    showImagePreviews: true,
    showVideoPreviews: true,
    showDocumentIcons: true,
    autoPlayVideos: false, // Auto-play on click
  },

  // ==========================================
  // GROUP SETTINGS
  // ==========================================
  groups: {
    // Maximum members per group (default: 50)
    maxMembers: 50,
    
    // Group features
    allowMemberInvites: true,
    allowMemberRemoval: true,
    allowGroupLeave: true,
    allowGroupDelete: true,
    allowNameChange: true,
    allowDescriptionChange: true,
    
    // Admin features
    requireAdminForInvite: false,
    requireAdminForRemoval: true,
    requireAdminForDelete: true,
  },

  // ==========================================
  // RAFTAI INTEGRATION
  // ==========================================
  raftai: {
    // Enable/disable RaftAI in group calls
    enabled: true,
    
    // Auto-add RaftAI to new groups
    autoAddToGroups: true,
    
    // RaftAI participant ID
    participantId: 'raftai',
    participantName: 'RaftAI',
    
    // RaftAI features
    announceCallStart: true,
    announceCallEnd: false,
    announceNewMembers: true,
    provideSuggestions: false, // Future feature
  },

  // ==========================================
  // UI CUSTOMIZATION
  // ==========================================
  ui: {
    // Theme colors (Tailwind classes)
    primaryColor: 'blue',
    accentColor: 'violet',
    
    // Message bubbles
    senderBubbleColor: 'bg-blue-600',
    receiverBubbleColor: 'bg-gray-700',
    systemMessageColor: 'bg-gray-800/50',
    
    // Header
    headerHeight: 'h-16',
    showOnlineStatus: true,
    showLastSeen: false,
    
    // Input area
    inputPlaceholder: 'Type a message...',
    showEmojiPicker: false, // Future feature
    showGifPicker: false, // Future feature
    
    // Message list
    messageSpacing: 'gap-2',
    messagePadding: 'p-3',
    messageRounded: 'rounded-2xl',
    
    // Animations
    enableAnimations: true,
    messageAnimationDuration: 200, // ms
  },

  // ==========================================
  // PERFORMANCE SETTINGS
  // ==========================================
  performance: {
    // Message pagination
    messagesPerPage: 50,
    loadMoreThreshold: 10, // messages from top to load more
    
    // Real-time update intervals
    typingIndicatorTimeout: 3000, // ms
    onlineStatusUpdateInterval: 30000, // ms (30 seconds)
    
    // Caching
    cacheMessages: true,
    cacheDuration: 300000, // ms (5 minutes)
    
    // Lazy loading
    lazyLoadImages: true,
    lazyLoadVideos: true,
    virtualizeMessages: false, // For very large chats (1000+ messages)
  },

  // ==========================================
  // SECURITY SETTINGS
  // ==========================================
  security: {
    // Message encryption (future feature)
    enableE2EEncryption: false,
    
    // Content filtering
    enableProfanityFilter: false,
    enableLinkPreview: false, // Can be security risk
    
    // Anti-spam
    rateLimitMessages: true,
    maxMessagesPerMinute: 30,
    
    // Privacy
    showOnlineStatus: true,
    showLastSeen: false,
    showReadReceipts: true,
    allowScreenshots: true,
  },

  // ==========================================
  // NOTIFICATIONS SETTINGS
  // ==========================================
  notifications: {
    // Desktop notifications
    enableDesktopNotifications: true,
    
    // Sound notifications
    playMessageSound: false,
    playCallSound: true,
    
    // Notification triggers
    notifyOnNewMessage: true,
    notifyOnMention: true,
    notifyOnReply: true,
    notifyOnReaction: false,
    
    // Do Not Disturb
    enableDND: false,
    dndStartHour: 22, // 10 PM
    dndEndHour: 8, // 8 AM
  },

  // ==========================================
  // DEBUGGING SETTINGS
  // ==========================================
  debug: {
    // Enable/disable console logs
    enableLogs: true,
    
    // Log levels
    logMessages: true,
    logCalls: true,
    logWebRTC: true,
    logFirebase: true,
    logErrors: true,
    
    // Detailed logs
    verboseLogging: false, // Show ALL details
    logTimestamps: true,
    logStackTraces: false,
  },

  // ==========================================
  // FEATURE FLAGS
  // ==========================================
  features: {
    // Experimental features
    enableMarkdownInMessages: false,
    enableCodeBlocks: false,
    enableMentions: false,
    enableHashtags: false,
    
    // Future features
    enableMessageSearch: false,
    enableMessageExport: false,
    enableVoiceMessages: true,
    enableVideoMessages: false,
    enableScreenSharing: false,
    enableFileSharing: true,
  }
};

/**
 * 🎯 CUSTOMIZATION EXAMPLES
 * 
 * 1. Disable video calls:
 *    CHAT_CONFIG.calls.videoCallsEnabled = false;
 * 
 * 2. Change call duration to 60 minutes:
 *    CHAT_CONFIG.calls.maxDuration = 60;
 * 
 * 3. Increase file upload limit to 50MB:
 *    CHAT_CONFIG.files.maxFileSize = 50;
 * 
 * 4. Disable RaftAI:
 *    CHAT_CONFIG.raftai.enabled = false;
 * 
 * 5. Change message bubble colors:
 *    CHAT_CONFIG.ui.senderBubbleColor = 'bg-green-600';
 * 
 * 6. Enable verbose logging:
 *    CHAT_CONFIG.debug.verboseLogging = true;
 */

// Export individual configs for easier imports
export const CALL_CONFIG = CHAT_CONFIG.calls;
export const MESSAGE_CONFIG = CHAT_CONFIG.messages;
export const FILE_CONFIG = CHAT_CONFIG.files;
export const RAFTAI_CONFIG = CHAT_CONFIG.raftai;
export const UI_CONFIG = CHAT_CONFIG.ui;
export const DEBUG_CONFIG = CHAT_CONFIG.debug;

// Utility functions
export const isFeatureEnabled = (feature: string): boolean => {
  return (CHAT_CONFIG.features as any)[feature] || false;
};

export const getCallDuration = (): number => {
  return CHAT_CONFIG.calls.maxDuration * 60; // Convert to seconds
};

export const getMaxFileSize = (): number => {
  return CHAT_CONFIG.files.maxFileSize * 1024 * 1024; // Convert to bytes
};

export default CHAT_CONFIG;
