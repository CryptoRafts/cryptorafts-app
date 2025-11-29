import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './firebase.client';
import { 
  VCTermSheetTemplate,
  DealRoom,
  VCAuditEvent 
} from './vc-data-models';

export class VCTermSheetManager {
  private static instance: VCTermSheetManager;
  private listeners = new Map<string, Unsubscribe>();

  static getInstance(): VCTermSheetManager {
    if (!VCTermSheetManager.instance) {
      VCTermSheetManager.instance = new VCTermSheetManager();
    }
    return VCTermSheetManager.instance;
  }

  /**
   * Get term sheet templates for organization
   */
  async getTermSheetTemplates(orgId: string): Promise<VCTermSheetTemplate[]> {
    const q = query(
      collection(db!, 'vcTermSheetTemplates'),
      where('orgId', '==', orgId),
      orderBy('isDefault', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VCTermSheetTemplate[];
  }

  /**
   * Get default term sheet template
   */
  async getDefaultTemplate(orgId: string): Promise<VCTermSheetTemplate | null> {
    const q = query(
      collection(db!, 'vcTermSheetTemplates'),
      where('orgId', '==', orgId),
      where('isDefault', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as VCTermSheetTemplate;
  }

  /**
   * Create term sheet template
   */
  async createTermSheetTemplate(
    orgId: string,
    name: string,
    description: string,
    template: VCTermSheetTemplate['template'],
    isDefault: boolean = false,
    userId: string
  ): Promise<string> {
    const templateRef = doc(collection(db!, 'vcTermSheetTemplates'));
    const templateId = templateRef.id;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await this.unsetDefaultTemplates(orgId);
    }

    const termSheetTemplate: VCTermSheetTemplate = {
      id: templateId,
      orgId,
      name,
      description,
      template,
      isDefault,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(templateRef, termSheetTemplate);

    // Log audit event
    await this.logAuditEvent('term_sheet_template_created', {
      orgId,
      templateId,
      name,
      userId
    });

    return templateId;
  }

  /**
   * Update term sheet template
   */
  async updateTermSheetTemplate(
    templateId: string,
    updates: Partial<Pick<VCTermSheetTemplate, 'name' | 'description' | 'template' | 'isDefault'>>,
    userId: string
  ): Promise<void> {
    const templateRef = doc(db!, 'vcTermSheetTemplates', templateId);
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      throw new Error('Template not found');
    }

    const templateData = templateDoc.data() as VCTermSheetTemplate;

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await this.unsetDefaultTemplates(templateData.orgId);
    }

    await updateDoc(templateRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Log audit event
    await this.logAuditEvent('term_sheet_template_updated', {
      orgId: templateData.orgId,
      templateId,
      updates,
      userId
    });
  }

  /**
   * Delete term sheet template
   */
  async deleteTermSheetTemplate(templateId: string, userId: string): Promise<void> {
    const templateRef = doc(db!, 'vcTermSheetTemplates', templateId);
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      throw new Error('Template not found');
    }

    const templateData = templateDoc.data() as VCTermSheetTemplate;

    await deleteDoc(templateRef);

    // Log audit event
    await this.logAuditEvent('term_sheet_template_deleted', {
      orgId: templateData.orgId,
      templateId,
      userId
    });
  }

  /**
   * Generate term sheet from template
   */
  generateTermSheetFromTemplate(
    template: VCTermSheetTemplate,
    data: Record<string, any>
  ): string {
    let content = '';
    
    for (const section of template.template.sections) {
      content += `## ${section.title}\n\n`;
      
      let sectionContent = section.content;
      
      // Replace variables
      for (const variable of section.variables) {
        const value = data[variable] || template.template.variables[variable]?.defaultValue || '';
        sectionContent = sectionContent.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      }
      
      content += sectionContent + '\n\n';
    }
    
    return content;
  }

  /**
   * Validate term sheet data
   */
  validateTermSheetData(
    template: VCTermSheetTemplate,
    data: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required variables
    for (const [variable, config] of Object.entries(template.template.variables)) {
      if (config.required && (!data[variable] || data[variable] === '')) {
        errors.push(`${variable} is required`);
      }
      
      // Validate variable types
      if (data[variable] !== undefined && data[variable] !== '') {
        switch (config.type) {
          case 'number':
            if (isNaN(Number(data[variable]))) {
              errors.push(`${variable} must be a number`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(data[variable]))) {
              errors.push(`${variable} must be a valid date`);
            }
            break;
          case 'select':
            if (config.options && !config.options.includes(data[variable])) {
              errors.push(`${variable} must be one of: ${config.options.join(', ')}`);
            }
            break;
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create term sheet in deal room
   */
  async createTermSheetInRoom(
    roomId: string,
    templateId: string,
    data: Record<string, any>,
    userId: string
  ): Promise<void> {
    // Get template
    const templateDoc = await getDoc(doc(db!, 'vcTermSheetTemplates', templateId));
    if (!templateDoc.exists()) {
      throw new Error('Template not found');
    }

    const template = templateDoc.data() as VCTermSheetTemplate;
    
    // Validate data
    const validation = this.validateTermSheetData(template, data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Generate content
    const content = this.generateTermSheetFromTemplate(template, data);
    
    // Update room with term sheet
    const roomRef = doc(db!, 'groupChats', roomId);
    await updateDoc(roomRef, {
      termSheet: {
        status: 'draft',
        amount: data.amount,
        valuation: data.valuation,
        equity: data.equity,
        vesting: data.vesting,
        rights: data.rights || [],
        versions: [{
          version: 1,
          content,
          createdAt: serverTimestamp(),
          createdBy: userId
        }],
        signatures: []
      },
      updatedAt: serverTimestamp()
    });

    // Log audit event
    await this.logAuditEvent('term_sheet_created', {
      roomId,
      templateId,
      userId
    });
  }

  /**
   * Update term sheet status
   */
  async updateTermSheetStatus(
    roomId: string,
    status: DealRoom['termSheet']['status'],
    userId: string
  ): Promise<void> {
    const roomRef = doc(db!, 'groupChats', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data() as DealRoom;
    
    if (!roomData.termSheet) {
      throw new Error('No term sheet found');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'draft': ['shared'],
      'shared': ['agreed_in_principle', 'draft'],
      'agreed_in_principle': ['legal_review', 'shared'],
      'legal_review': ['signed', 'agreed_in_principle'],
      'signed': ['funded'],
      'funded': ['closed']
    };

    const currentStatus = roomData.termSheet.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    await updateDoc(roomRef, {
      'termSheet.status': status,
      updatedAt: serverTimestamp()
    });

    // Log audit event
    await this.logAuditEvent('term_sheet_status_updated', {
      roomId,
      status,
      userId
    });
  }

  /**
   * Add term sheet version
   */
  async addTermSheetVersion(
    roomId: string,
    content: string,
    userId: string
  ): Promise<void> {
    const roomRef = doc(db!, 'groupChats', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data() as DealRoom;
    
    if (!roomData.termSheet) {
      throw new Error('No term sheet found');
    }

    const currentVersion = roomData.termSheet.versions.length;
    const newVersion = {
      version: currentVersion + 1,
      content,
      createdAt: serverTimestamp(),
      createdBy: userId
    };

    await updateDoc(roomRef, {
      'termSheet.versions': [...roomData.termSheet.versions, newVersion],
      updatedAt: serverTimestamp()
    });

    // Log audit event
    await this.logAuditEvent('term_sheet_version_added', {
      roomId,
      version: newVersion.version,
      userId
    });
  }

  /**
   * Sign term sheet
   */
  async signTermSheet(
    roomId: string,
    signature: string,
    userId: string
  ): Promise<void> {
    const roomRef = doc(db!, 'groupChats', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data() as DealRoom;
    
    if (!roomData.termSheet) {
      throw new Error('No term sheet found');
    }

    if (roomData.termSheet.status !== 'legal_review') {
      throw new Error('Term sheet must be in legal review status to sign');
    }

    // Check if already signed
    const alreadySigned = roomData.termSheet.signatures?.some(s => s.userId === userId);
    if (alreadySigned) {
      throw new Error('Term sheet already signed by this user');
    }

    const signatures = roomData.termSheet.signatures || [];
    signatures.push({
      userId,
      signedAt: serverTimestamp(),
      signature
    });

    await updateDoc(roomRef, {
      'termSheet.signatures': signatures,
      updatedAt: serverTimestamp()
    });

    // Check if all required signatures are collected
    const requiredSignatures = roomData.members.length;
    if (signatures.length >= requiredSignatures) {
      await this.updateTermSheetStatus(roomId, 'signed', userId);
    }

    // Log audit event
    await this.logAuditEvent('term_sheet_signed', {
      roomId,
      userId
    });
  }

  /**
   * Export term sheet
   */
  async exportTermSheet(
    roomId: string,
    format: 'pdf' | 'docx' | 'html' = 'pdf'
  ): Promise<string> {
    const roomDoc = await getDoc(doc(db!, 'groupChats', roomId));
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data() as DealRoom;
    
    if (!roomData.termSheet) {
      throw new Error('No term sheet found');
    }

    const latestVersion = roomData.termSheet.versions[roomData.termSheet.versions.length - 1];
    
    // Call export API
    const response = await fetch('/api/term-sheet/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
      },
      body: JSON.stringify({
        roomId,
        content: latestVersion.content,
        format,
        metadata: {
          amount: roomData.termSheet.amount,
          valuation: roomData.termSheet.valuation,
          equity: roomData.termSheet.equity,
          status: roomData.termSheet.status,
          signatures: roomData.termSheet.signatures
        }
      })
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result.downloadUrl;
  }

  /**
   * Get term sheet analytics
   */
  async getTermSheetAnalytics(orgId: string): Promise<{
    totalTermSheets: number;
    byStatus: Record<string, number>;
    averageTimeToSign: number;
    successRate: number;
  }> {
    // Get all deal rooms with term sheets for this org
    const q = query(
      collection(db!, 'groupChats'),
      where('orgId', '==', orgId),
      where('type', '==', 'deal')
    );

    const snapshot = await getDocs(q);
    const rooms = snapshot.docs.map(doc => doc.data() as DealRoom);
    
    const roomsWithTermSheets = rooms.filter(room => room.termSheet);
    
    const analytics = {
      totalTermSheets: roomsWithTermSheets.length,
      byStatus: {} as Record<string, number>,
      averageTimeToSign: 0,
      successRate: 0
    };

    // Calculate status distribution
    roomsWithTermSheets.forEach(room => {
      const status = room.termSheet!.status;
      analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;
    });

    // Calculate success rate (signed + funded + closed)
    const successful = analytics.byStatus['signed'] + analytics.byStatus['funded'] + analytics.byStatus['closed'];
    analytics.successRate = analytics.totalTermSheets > 0 ? (successful / analytics.totalTermSheets) * 100 : 0;

    // Calculate average time to sign
    const signedTermSheets = roomsWithTermSheets.filter(room => 
      room.termSheet!.signatures && room.termSheet!.signatures.length > 0
    );
    
    if (signedTermSheets.length > 0) {
      const totalTime = signedTermSheets.reduce((sum, room) => {
        const firstSignature = room.termSheet!.signatures![0];
        const timeDiff = firstSignature.signedAt.toDate().getTime() - room.createdAt.toDate().getTime();
        return sum + timeDiff;
      }, 0);
      
      analytics.averageTimeToSign = totalTime / signedTermSheets.length / (1000 * 60 * 60 * 24); // Convert to days
    }

    return analytics;
  }

  /**
   * Unset default templates
   */
  private async unsetDefaultTemplates(orgId: string): Promise<void> {
    const q = query(
      collection(db!, 'vcTermSheetTemplates'),
      where('orgId', '==', orgId),
      where('isDefault', '==', true)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isDefault: false, updatedAt: serverTimestamp() })
    );

    await Promise.all(updatePromises);
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(action: string, data: any): Promise<void> {
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          action,
          data,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Clean up listener
   */
  private cleanupListener(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanupAll(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }
}

export const vcTermSheetManager = VCTermSheetManager.getInstance();
