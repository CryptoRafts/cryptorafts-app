import { getAdminDb } from "./firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export interface AuditEntry {
  type: string;
  actorUid: string | null;
  subject: any;
  delta: any;
  requestId: string;
  ts: number;
  immutable: true;
}

export class AuditLogger {
  private db = getAdminDb();

  async log(action: {
    type: string;
    actorUid: string | null;
    subject: any;
    delta?: any;
    requestId?: string;
  }): Promise<void> {
    try {
      const auditEntry: AuditEntry = {
        type: action.type,
        actorUid: action.actorUid,
        subject: action.subject,
        delta: action.delta || {},
        requestId: action.requestId || uuidv4(),
        ts: Date.now(),
        immutable: true
      };

      await this.db.collection("audit").add(auditEntry);
    } catch (error) {
      console.error("Failed to log audit entry:", error);
      // Don't throw - audit failures shouldn't break the main operation
    }
  }

  async logAdminAction(adminUid: string, action: string, details: any, requestId?: string): Promise<void> {
    await this.log({
      type: `admin.${action}`,
      actorUid: adminUid,
      subject: details,
      requestId
    });
  }

  async logDepartmentAction(deptUid: string, department: string, action: string, details: any, requestId?: string): Promise<void> {
    await this.log({
      type: `dept.${department}.${action}`,
      actorUid: deptUid,
      subject: details,
      requestId
    });
  }

  async logUserAction(userUid: string, action: string, details: any, requestId?: string): Promise<void> {
    await this.log({
      type: `user.${action}`,
      actorUid: userUid,
      subject: details,
      requestId
    });
  }

  async logSystemAction(action: string, details: any, requestId?: string): Promise<void> {
    await this.log({
      type: `system.${action}`,
      actorUid: null,
      subject: details,
      requestId
    });
  }
}

export const auditLogger = new AuditLogger();
