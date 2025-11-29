"use client";

import { User } from 'firebase/auth';
import { db, doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc, serverTimestamp } from './firebase.client';
import { addDepartmentMember } from './departmentAuth';

/**
 * Auto-assign Google logged-in user to their department
 * This runs after Google authentication to automatically assign users to departments
 */
export async function autoAssignUserToDepartment(user: User): Promise<boolean> {
  try {
    console.log('🔍 Checking department assignment for:', user.email);
    
    if (!user.email) {
      console.log('❌ No email found for user');
      return false;
    }

    // Check if user is already assigned to a department
    const userDoc = await getDoc(doc(db!, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // If user already has a department, don't reassign
      if (userData.department) {
        console.log('✅ User already assigned to department:', userData.department);
        return true;
      }
    }

    // Check departmentMembers collection for this email
    const { query: queryFn, collection: collectionFn, where: whereFn } = await import('firebase/firestore');
    if (!db) {
      console.log('❌ Firestore not initialized');
      return false;
    }
    const membersQuery = queryFn(
      collectionFn(db, 'departmentMembers'),
      whereFn('email', '==', user.email.toLowerCase()),
      whereFn('active', '==', true)
    );

    const membersSnapshot = await getDocs(membersQuery);
    
    if (!membersSnapshot.empty) {
      const memberData = membersSnapshot.docs[0].data();
      const department = memberData.department;
      
      console.log('✅ Found department assignment for:', user.email, '->', department);
      
      // Update user document with department info
      await updateDoc(doc(db!, 'users', user.uid), {
        department: department,
        departmentRole: memberData.role || 'member',
        permissions: memberData.permissions || [],
        role: 'department_member',
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      console.log('✅ User auto-assigned to department:', department);
      return true;
    }

    // Check departments collection to see if user email matches any head
    const { query: deptQueryFn, collection: deptCollectionFn, where: deptWhereFn } = await import('firebase/firestore');
    const departmentsQuery = deptQueryFn(
      deptCollectionFn(db, 'departments'),
      deptWhereFn('headEmail', '==', user.email.toLowerCase())
    );

    const departmentsSnapshot = await getDocs(departmentsQuery);
    
    if (!departmentsSnapshot.empty) {
      const deptData = departmentsSnapshot.docs[0].data();
      const departmentId = departmentsSnapshot.docs[0].id;
      
      console.log('✅ Found user as department head:', user.email, '->', deptData.name);
      
      // Update user document with department info
      await updateDoc(doc(db!, 'users', user.uid), {
        department: deptData.name,
        departmentRole: 'head',
        permissions: deptData.permissions || [],
        role: 'department_member',
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      // Also add to departmentMembers collection if not exists
      const memberDoc = await getDoc(doc(db!, 'departmentMembers', user.uid));
      if (!memberDoc.exists()) {
        await setDoc(doc(db!, 'departmentMembers', user.uid), {
          userId: user.uid,
          email: user.email?.toLowerCase(),
          department: deptData.name,
          role: 'head',
          permissions: deptData.permissions || [],
          addedBy: 'system',
          addedAt: serverTimestamp(),
          active: true
        });
      }

      console.log('✅ Department head auto-assigned:', deptData.name);
      return true;
    }

    console.log('ℹ️ No department assignment found for:', user.email);
    return false;
  } catch (error) {
    console.error('❌ Error auto-assigning user to department:', error);
    return false;
  }
}

