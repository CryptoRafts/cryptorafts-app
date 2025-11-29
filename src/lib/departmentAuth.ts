/**
 * Department Authentication & Access Control
 * Manages department member authentication and permissions
 * NO MIXING with admin or other roles
 */

import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';

export type DepartmentType = 
  | 'KYC' 
  | 'KYB' 
  | 'Finance' 
  | 'Registration' 
  | 'Pitch Intake'
  | 'Chat'
  | 'Compliance'
  | 'Operations';

export type DepartmentRole = 'head' | 'manager' | 'analyst' | 'member';

export interface DepartmentMember {
  userId: string;
  email: string;
  department: DepartmentType;
  role: DepartmentRole;
  permissions: string[];
  addedBy: string;
  addedAt: string;
  active: boolean;
}

/**
 * Check if user has department access
 */
export async function checkDepartmentAccess(userId: string): Promise<DepartmentMember | null> {
  try {
    console.log('🏢 Checking department access for user:', userId);

    // Check departmentMembers collection
    const memberDoc = await getDoc(doc(db!, 'departmentMembers', userId));
    
    if (memberDoc.exists()) {
      const data = memberDoc.data();
      
      if (data.active === false) {
        console.log('❌ Department member is inactive');
        return null;
      }

      console.log('✅ Department member found:', data.department);
      
      return {
        userId,
        email: data.email,
        department: data.department,
        role: data.role || 'member',
        permissions: data.permissions || [],
        addedBy: data.addedBy || 'admin',
        addedAt: data.addedAt || new Date().toISOString(),
        active: data.active !== false
      };
    }

    // Check user document for department field
    const userDoc = await getDoc(doc(db!, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      if (userData.department && userData.role === 'department_member') {
        console.log('✅ Department found in user document');
        
        return {
          userId,
          email: userData.email,
          department: userData.department,
          role: userData.departmentRole || 'member',
          permissions: userData.permissions || [],
          addedBy: userData.addedBy || 'admin',
          addedAt: userData.createdAt || new Date().toISOString(),
          active: true
        };
      }
    }

    console.log('❌ No department access found');
    return null;
  } catch (error) {
    console.error('Error checking department access:', error);
    return null;
  }
}

/**
 * Get department dashboard URL
 */
export function getDepartmentDashboardUrl(department: DepartmentType): string {
  const departmentPaths: Record<DepartmentType, string> = {
    'KYC': '/departments/kyc',
    'KYB': '/departments/kyb',
    'Finance': '/departments/finance',
    'Registration': '/departments/registration',
    'Pitch Intake': '/departments/pitch-intake',
    'Chat': '/departments/chat',
    'Compliance': '/departments/compliance',
    'Operations': '/departments/operations'
  };

  return departmentPaths[department] || '/departments';
}

/**
 * Add department member (admin only)
 */
export async function addDepartmentMember(
  email: string,
  department: DepartmentType,
  role: DepartmentRole,
  permissions: string[],
  addedBy: string
): Promise<void> {
  try {
    console.log('➕ Adding department member:', email, 'to', department);

    // Find user by email
    const usersQuery = query(
      collection(db!, 'users'),
      where('email', '==', email.toLowerCase())
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      throw new Error('User not found. Please ask the user to create an account first.');
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Add to departmentMembers collection
    await setDoc(doc(db!, 'departmentMembers', userId), {
      userId,
      email: email.toLowerCase(),
      department,
      role,
      permissions,
      addedBy,
      addedAt: new Date().toISOString(),
      active: true
    });

    // Update user document
    await setDoc(doc(db!, 'users', userId), {
      role: 'department_member',
      department,
      departmentRole: role,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('✅ Department member added successfully');
  } catch (error) {
    console.error('Error adding department member:', error);
    throw error;
  }
}

/**
 * Remove department member (admin only)
 */
export async function removeDepartmentMember(userId: string): Promise<void> {
  try {
    console.log('➖ Removing department member:', userId);

    // Deactivate in departmentMembers
    await setDoc(doc(db!, 'departmentMembers', userId), {
      active: false,
      removedAt: new Date().toISOString()
    }, { merge: true });

    // Update user document
    await setDoc(doc(db!, 'users', userId), {
      role: null,
      department: null,
      departmentRole: null,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('✅ Department member removed successfully');
  } catch (error) {
    console.error('Error removing department member:', error);
    throw error;
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(member: DepartmentMember, permission: string): boolean {
  // Department heads have all permissions
  if (member.role === 'head') {
    return true;
  }

  // Check specific permission
  return member.permissions.includes(permission);
}

/**
 * Get all department members (admin only)
 */
export async function getAllDepartmentMembers(): Promise<DepartmentMember[]> {
  try {
    const membersSnapshot = await getDocs(collection(db!, 'departmentMembers'));
    
    return membersSnapshot.docs
      .map(doc => doc.data() as DepartmentMember)
      .filter(member => member.active !== false);
  } catch (error) {
    console.error('Error getting department members:', error);
    return [];
  }
}

/**
 * Get members of specific department
 */
export async function getDepartmentMembers(department: DepartmentType): Promise<DepartmentMember[]> {
  try {
    const membersQuery = query(
      collection(db!, 'departmentMembers'),
      where('department', '==', department),
      where('active', '==', true)
    );
    
    const membersSnapshot = await getDocs(membersQuery);
    
    return membersSnapshot.docs.map(doc => doc.data() as DepartmentMember);
  } catch (error) {
    console.error('Error getting department members:', error);
    return [];
  }
}

/**
 * Department session management
 */
export const DepartmentSession = {
  save(userId: string, email: string, department: DepartmentType, role: DepartmentRole): void {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', 'department_member');
    localStorage.setItem('department', department);
    localStorage.setItem('departmentRole', role);
    console.log('✅ Department session saved');
  },

  clear(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('department');
    localStorage.removeItem('departmentRole');
    console.log('✅ Department session cleared');
  },

  get(): { department: DepartmentType; role: DepartmentRole } | null {
    const department = localStorage.getItem('department');
    const role = localStorage.getItem('departmentRole');
    
    if (department && role) {
      return {
        department: department as DepartmentType,
        role: role as DepartmentRole
      };
    }
    
    return null;
  }
};

/**
 * Check if current route requires department access
 */
export function isDepartmentRoute(pathname: string): boolean {
  return pathname.startsWith('/departments/') && pathname !== '/departments/login';
}

/**
 * Verify department access for route
 */
export async function verifyDepartmentRoute(
  user: User | null,
  pathname: string
): Promise<{ authorized: boolean; redirectTo?: string; member?: DepartmentMember }> {
  if (!user) {
    return { authorized: false, redirectTo: '/departments/login' };
  }

  const member = await checkDepartmentAccess(user.uid);
  
  if (!member) {
    return { authorized: false, redirectTo: '/departments/login' };
  }

  // Extract department from pathname
  const pathDepartment = pathname.split('/')[2];
  const memberDepartment = member.department.toLowerCase().replace(/\s+/g, '-');

  // Check if user is accessing their department
  if (pathDepartment !== memberDepartment) {
    return { 
      authorized: false, 
      redirectTo: getDepartmentDashboardUrl(member.department) 
    };
  }

  return { authorized: true, member };
}

