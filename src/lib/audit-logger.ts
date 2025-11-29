// Audit logging for deal room activities
export interface AuditEntry {
  id: string;
  type: 'room_created' | 'room_joined' | 'room_left' | 'room_renamed' | 'member_added' | 'member_removed' | 'message_sent' | 'file_uploaded';
  actorId: string;
  actorName: string;
  roomId: string;
  roomName: string;
  details: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditEntry[] = [];

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Log an audit entry
  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry
    };

    this.logs.push(auditEntry);
    
    // Log to console for development
    console.log('🔍 Audit Log:', {
      type: auditEntry.type,
      actor: auditEntry.actorName,
      room: auditEntry.roomName,
      details: auditEntry.details,
      timestamp: auditEntry.timestamp.toISOString()
    });

    // In production, this would save to a secure audit database
    this.saveToStorage(auditEntry);
  }

  // Log room creation
  logRoomCreated(actorId: string, actorName: string, roomId: string, roomName: string, details?: any): void {
    this.log({
      type: 'room_created',
      actorId,
      actorName,
      roomId,
      roomName,
      details: {
        creator: actorName,
        roomType: 'deal_room',
        members: details?.members || [],
        ...details
      }
    });
  }

  // Log room join
  logRoomJoined(actorId: string, actorName: string, roomId: string, roomName: string, details?: any): void {
    this.log({
      type: 'room_joined',
      actorId,
      actorName,
      roomId,
      roomName,
      details
    });
  }

  // Log room leave
  logRoomLeft(actorId: string, actorName: string, roomId: string, roomName: string, details?: any): void {
    this.log({
      type: 'room_left',
      actorId,
      actorName,
      roomId,
      roomName,
      details
    });
  }

  // Log room rename
  logRoomRenamed(actorId: string, actorName: string, roomId: string, roomName: string, oldName: string, newName: string): void {
    this.log({
      type: 'room_renamed',
      actorId,
      actorName,
      roomId,
      roomName,
      details: {
        oldName,
        newName
      }
    });
  }

  // Log member added
  logMemberAdded(actorId: string, actorName: string, roomId: string, roomName: string, memberId: string, memberName: string, role: string): void {
    this.log({
      type: 'member_added',
      actorId,
      actorName,
      roomId,
      roomName,
      details: {
        memberId,
        memberName,
        role
      }
    });
  }

  // Log member removed
  logMemberRemoved(actorId: string, actorName: string, roomId: string, roomName: string, memberId: string, memberName: string, reason?: string): void {
    this.log({
      type: 'member_removed',
      actorId,
      actorName,
      roomId,
      roomName,
      details: {
        memberId,
        memberName,
        reason
      }
    });
  }

  // Log message sent
  logMessageSent(actorId: string, actorName: string, roomId: string, roomName: string, messageType: string, messageLength: number): void {
    this.log({
      type: 'message_sent',
      actorId,
      actorName,
      roomId,
      roomName,
      details: {
        messageType,
        messageLength
      }
    });
  }

  // Log file uploaded
  logFileUploaded(actorId: string, actorName: string, roomId: string, roomName: string, fileName: string, fileSize: number, fileType: string): void {
    this.log({
      type: 'file_uploaded',
      actorId,
      actorName,
      roomId,
      roomName,
      details: {
        fileName,
        fileSize,
        fileType
      }
    });
  }

  // Get audit logs for a room
  getRoomLogs(roomId: string): AuditEntry[] {
    return this.logs.filter(log => log.roomId === roomId);
  }

  // Get audit logs for a user
  getUserLogs(actorId: string): AuditEntry[] {
    return this.logs.filter(log => log.actorId === actorId);
  }

  // Get all audit logs
  getAllLogs(): AuditEntry[] {
    return [...this.logs];
  }

  // Save to localStorage for demo purposes
  private saveToStorage(auditEntry: AuditEntry): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('auditLogs');
        const logs = stored ? JSON.parse(stored) : [];
        logs.push(auditEntry);
        localStorage.setItem('auditLogs', JSON.stringify(logs));
      }
    } catch (error) {
      console.error('Failed to save audit log to storage:', error);
    }
  }

  // Load from localStorage
  loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('auditLogs');
        if (stored) {
          const logs = JSON.parse(stored);
          this.logs = logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load audit logs from storage:', error);
    }
  }

  // Clear all logs (for testing)
  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auditLogs');
    }
    console.log('All audit logs cleared');
  }
}

export const auditLogger = AuditLogger.getInstance();

// Load existing logs on initialization
if (typeof window !== 'undefined') {
  auditLogger.loadFromStorage();
  
  // Add console utilities for testing
  (window as any).auditLogger = {
    getRoomLogs: (roomId: string) => auditLogger.getRoomLogs(roomId),
    getUserLogs: (actorId: string) => auditLogger.getUserLogs(actorId),
    getAllLogs: () => auditLogger.getAllLogs(),
    clearLogs: () => auditLogger.clearLogs()
  };
  
  console.log('🔍 Audit logger loaded! Available commands:');
  console.log('- auditLogger.getRoomLogs("roomId") - Get logs for a room');
  console.log('- auditLogger.getUserLogs("userId") - Get logs for a user');
  console.log('- auditLogger.getAllLogs() - Get all logs');
  console.log('- auditLogger.clearLogs() - Clear all logs');
}
