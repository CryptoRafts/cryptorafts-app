"use client";

import { db, collection, query, where, getDocs } from './firebase.client';
import { Firestore } from 'firebase/firestore';

/**
 * Check if a user with this email already exists
 */
export async function checkDuplicateUser(email: string): Promise<boolean> {
  try {
    const { query: queryFn, collection: collectionFn, where: whereFn } = await import('firebase/firestore');
    
    if (!db) {
      console.error('❌ Database not initialized');
      return false;
    }

    const q = queryFn(
      collectionFn(db, 'users'),
      whereFn('email', '==', email.toLowerCase())
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty; // Returns true if duplicate exists
  } catch (error) {
    console.error('❌ Error checking duplicate user:', error);
    return false;
  }
}

/**
 * Check if a KYC document already exists for this user
 */
export async function checkDuplicateKYC(userId: string): Promise<boolean> {
  try {
    const { query: queryFn, collection: collectionFn, where: whereFn } = await import('firebase/firestore');
    
    if (!db) {
      console.error('❌ Database not initialized');
      return false;
    }

    const q = queryFn(
      collectionFn(db, 'kyc_documents'),
      whereFn('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Error checking duplicate KYC:', error);
    return false;
  }
}

/**
 * Check if a KYB document already exists for this email/organization
 */
export async function checkDuplicateKYB(email: string, organizationName: string): Promise<boolean> {
  try {
    const { query: queryFn, collection: collectionFn, where: whereFn } = await import('firebase/firestore');
    
    if (!db) {
      console.error('❌ Database not initialized');
      return false;
    }

    // Check by email
    const emailQuery = queryFn(
      collectionFn(db, 'organizations'),
      whereFn('email', '==', email.toLowerCase())
    );

    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      return true;
    }

    // Check by organization name
    const nameQuery = queryFn(
      collectionFn(db, 'organizations'),
      whereFn('organizationName', '==', organizationName)
    );

    const nameSnapshot = await getDocs(nameQuery);
    return !nameSnapshot.empty;
  } catch (error) {
    console.error('❌ Error checking duplicate KYB:', error);
    return false;
  }
}

/**
 * Remove duplicate records from a collection
 */
export async function removeDuplicates(
  collectionName: string,
  uniqueField: string
): Promise<number> {
  try {
    const { query: queryFn, collection: collectionFn, doc, deleteDoc, getDocs, orderBy: orderByFn } = await import('firebase/firestore');
    
    if (!db) {
      console.error('❌ Database not initialized');
      return 0;
    }

    const q = queryFn(
      collectionFn(db, collectionName),
      orderByFn(uniqueField)
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const seen = new Map<string, string>(); // fieldValue -> docId
    let removed = 0;

    for (const docSnap of docs) {
      const data = docSnap.data();
      const fieldValue = data[uniqueField];

      if (seen.has(fieldValue)) {
        // This is a duplicate - keep the oldest one, delete this one
        await deleteDoc(doc(db!, collectionName, docSnap.id));
        removed++;
        console.log(`🗑️ Removed duplicate ${collectionName} doc:`, docSnap.id);
      } else {
        seen.set(fieldValue, docSnap.id);
      }
    }

    console.log(`✅ Removed ${removed} duplicate ${collectionName} records`);
    return removed;
  } catch (error) {
    console.error(`❌ Error removing duplicates from ${collectionName}:`, error);
    return 0;
  }
}

