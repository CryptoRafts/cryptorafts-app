"use client";

import { User } from 'firebase/auth';
import { db, doc, getDoc, query, collection, where, getDocs, updateDoc, serverTimestamp, setDoc } from './firebase.client';

/**
 * Auto-assign Google logged-in user to VC role if their email is in VC team members
 * This runs after Google authentication to automatically assign users to VC role
 */
export async function autoAssignUserToVCTeam(user: User): Promise<boolean> {
  try {
    console.log('🔍 Checking VC team assignment for:', user.email);
    
    if (!user.email) {
      console.log('❌ No email found for user');
      return false;
    }

    // Check if user is already in this VC team
    const userDoc = await getDoc(doc(db!, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // If user is already in a VC team and it matches, just update last login
      if (userData.role === 'vc' && userData.vcTeamMemberId) {
        // Check if they're still in the team
        const existingMemberRef = doc(db!, 'vc_team_members', userData.vcTeamMemberId);
        const existingMemberDoc = await getDoc(existingMemberRef);
        if (existingMemberDoc.exists()) {
          const memberData = existingMemberDoc.data();
          if (memberData.email?.toLowerCase() === user.email?.toLowerCase()) {
            console.log('✅ User already in VC team, updating last login');
            await updateDoc(doc(db!, 'users', user.uid), {
              lastLoginAt: serverTimestamp()
            });
            return true;
          }
        }
      }
    }

    // Check vc_team_members collection for this email
    if (!db) {
      console.log('❌ Firestore not initialized');
      return false;
    }

    const { query: queryFn, collection: collectionFn, where: whereFn } = await import('firebase/firestore');
    // Check for invited or active members with this email
    const membersQuery = queryFn(
      collectionFn(db, 'vc_team_members'),
      whereFn('email', '==', user.email.toLowerCase())
    );

    const membersSnapshot = await getDocs(membersQuery);
    
    if (!membersSnapshot.empty) {
      // Find the first invited or active member (or any if status doesn't matter)
      const memberDoc = membersSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.status === 'invited' || data.status === 'active' || !data.status;
      }) || membersSnapshot.docs[0];
      
      const memberData = memberDoc.data();
      const orgId = memberData.orgId;
      
      console.log('✅ Found VC team assignment for:', user.email, '-> Org:', orgId);
      
      // Update team member status to active and link user ID
      const memberRef = doc(db!, 'vc_team_members', memberDoc.id);
      await updateDoc(memberRef, {
        status: 'active',
        userId: user.uid,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update user document with VC role and org info
      // This allows users to be part of VC team even if they had another role
      await setDoc(doc(db!, 'users', user.uid), {
        role: 'vc',
        orgId: orgId,
        vcTeamRole: memberData.role || 'member',
        email: user.email,
        displayName: user.displayName || memberData.fullName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        vcTeamMemberId: memberDoc.id,
        // Keep previous role info for reference
        previousRole: userDoc.exists() ? userDoc.data()?.role : null
      }, { merge: true });

      // Update custom claims via API
      try {
        const token = await user.getIdToken(true); // Force refresh token
        await fetch('/api/auth/update-claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            role: 'vc',
            orgId: orgId
          })
        });
      } catch (claimsError) {
        console.warn('⚠️ Failed to update custom claims:', claimsError);
      }

      console.log('✅ User auto-assigned to VC team:', orgId);
      return true;
    }

    console.log('❌ No VC team assignment found for:', user.email);
    return false;
  } catch (error) {
    console.error('❌ Error checking VC team assignment:', error);
    return false;
  }
}

