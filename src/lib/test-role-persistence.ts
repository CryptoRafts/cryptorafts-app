// Test script for role persistence functionality
import { setUserRole, getUserRole, updateUserClaims, clearUserRole } from './role-persistence';

export const testRolePersistence = () => {
  console.log('🧪 Testing Role Persistence System...');
  
  // Test 1: Set a role
  console.log('Test 1: Setting VC role...');
  setUserRole('vc', {
    orgId: 'test-org-123',
    onboardingComplete: false,
    profileCompleted: false
  });
  
  // Test 2: Get the role back
  console.log('Test 2: Getting stored role...');
  const storedRole = getUserRole();
  console.log('Stored role data:', storedRole);
  
  // Test 3: Update claims
  console.log('Test 3: Updating claims...');
  updateUserClaims({
    profileCompleted: true,
    onboardingComplete: true
  });
  
  // Test 4: Get updated role
  console.log('Test 4: Getting updated role...');
  const updatedRole = getUserRole();
  console.log('Updated role data:', updatedRole);
  
  // Test 5: Clear role
  console.log('Test 5: Clearing role...');
  clearUserRole();
  
  // Test 6: Verify cleared
  console.log('Test 6: Verifying role is cleared...');
  const clearedRole = getUserRole();
  console.log('Cleared role data:', clearedRole);
  
  console.log('✅ Role persistence test completed');
  
  return {
    initialRole: storedRole,
    updatedRole,
    clearedRole
  };
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testRolePersistence = testRolePersistence;
}
