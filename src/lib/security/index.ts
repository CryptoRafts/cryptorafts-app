/**
 * Security & Data Isolation Layer - Main Export
 * Complete UID-based data isolation and security
 */

export { DataIsolation, DataIsolationError, validateUID, USER_NAMESPACES } from './data-isolation';
export { Isolated, IsolatedProjects, IsolatedChats, IsolatedNotifications, IsolatedFiles, IsolatedDeals } from './isolated-operations';

// Re-export all isolation functions for convenience
export {
  validateOwnership,
  validateParticipant,
  createIsolatedQuery,
  subscribeToIsolatedCollection,
  getIsolatedDocument,
  setIsolatedDocument,
  updateIsolatedDocument,
  deleteIsolatedDocument,
  getUserProjects,
  getUserChats,
  getUserNotifications,
  isAdmin,
  getDataWithAdminAccess,
  subscribeWithAdminAccess,
  sanitizeDataForUser,
  logIsolationBreach,
  generateIsolatedCacheKey,
  clearUserCache,
  checkIsolationHealth,
} from './data-isolation';

/**
 * Quick access to isolated operations
 */
export const Security = {
  // Validation
  validateUID,
  isAdmin: DataIsolation.isAdmin,
  checkHealth: DataIsolation.checkIsolationHealth,
  
  // Operations
  Projects: Isolated.Projects,
  Chats: Isolated.Chats,
  Notifications: Isolated.Notifications,
  Files: Isolated.Files,
  Deals: Isolated.Deals,
  
  // Utilities
  sanitize: DataIsolation.sanitizeDataForUser,
  clearCache: DataIsolation.clearUserCache,
  logBreach: DataIsolation.logIsolationBreach,
};

