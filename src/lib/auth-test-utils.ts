// Authentication test utilities and diagnostics

import { auth } from './firebase.client';
import { listenerManager } from './firestore-listener-manager';

export interface AuthTestResult {
  scenario: string;
  success: boolean;
  error?: string;
  details: any;
  timestamp: string;
}

export class AuthTestRunner {
  private results: AuthTestResult[] = [];

  async runAllTests(): Promise<AuthTestResult[]> {
    console.log('🧪 Starting authentication tests...');
    
    this.results = [];
    
    // Test Firebase initialization
    await this.testFirebaseInit();
    
    // Test auth state
    await this.testAuthState();
    
    // Test listener management
    await this.testListenerManagement();
    
    // Test environment
    await this.testEnvironment();
    
    console.log('🧪 Authentication tests completed:', this.results);
    return this.results;
  }

  private async testFirebaseInit(): Promise<void> {
    try {
      const app = auth.app;
      const projectId = app.options.projectId;
      
      this.addResult({
        scenario: 'Firebase Initialization',
        success: !!projectId,
        details: { projectId, hasAuth: !!auth },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      this.addResult({
        scenario: 'Firebase Initialization',
        success: false,
        error: error.message,
        details: {},
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testAuthState(): Promise<void> {
    try {
      const user = auth.currentUser;
      const isAuthenticated = !!user;
      
      this.addResult({
        scenario: 'Auth State',
        success: true,
        details: { 
          isAuthenticated, 
          uid: user?.uid,
          email: user?.email 
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      this.addResult({
        scenario: 'Auth State',
        success: false,
        error: error.message,
        details: {},
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testListenerManagement(): Promise<void> {
    try {
      const listenerCount = listenerManager.getListenerCount();
      const activeListeners = listenerManager.getActiveListeners();
      
      this.addResult({
        scenario: 'Listener Management',
        success: listenerCount >= 0,
        details: { 
          listenerCount, 
          activeListeners: activeListeners.length 
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      this.addResult({
        scenario: 'Listener Management',
        success: false,
        error: error.message,
        details: {},
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testEnvironment(): Promise<void> {
    try {
      const isClient = typeof window !== 'undefined';
      const isServer = typeof window === 'undefined';
      
      this.addResult({
        scenario: 'Environment',
        success: isClient,
        details: { 
          isClient, 
          isServer,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      this.addResult({
        scenario: 'Environment',
        success: false,
        error: error.message,
        details: {},
        timestamp: new Date().toISOString()
      });
    }
  }

  private addResult(result: AuthTestResult): void {
    this.results.push(result);
    console.log(`🧪 ${result.scenario}: ${result.success ? '✅' : '❌'}`, result);
  }

  getResults(): AuthTestResult[] {
    return this.results;
  }

  getSuccessCount(): number {
    return this.results.filter(r => r.success).length;
  }

  getTotalCount(): number {
    return this.results.length;
  }
}

// Export singleton instance
export const authTestRunner = new AuthTestRunner();

// Global test function for debugging
if (typeof window !== 'undefined') {
  (window as any).runAuthTests = () => authTestRunner.runAllTests();
}
