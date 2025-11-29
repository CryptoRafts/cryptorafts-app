"use client";

import { useEffect } from "react";
import { useSimpleAuth } from "@/lib/auth-simple";
import { useRouter } from "next/navigation";
import ProjectPitchWizard from "@/components/ProjectPitchWizard";
import { db, collection, addDoc } from '@/lib/firebase.client';

export default function PitchPage() {
  const { user, profile, loading, isAuthed } = useSimpleAuth();
  const router = useRouter();
  const isFounder = profile?.role === 'founder';

  useEffect(() => {
    if (!loading && !isAuthed) {
      router.push('/login');
      return;
    }
    
    if (!loading && isAuthed && !isFounder) {
      router.push('/role');
      return;
    }
  }, [loading, isAuthed, isFounder, router]);

  if (loading) {
    return (
      <div className="min-h-screen neo-blue-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed || !isFounder) {
    return null;
  }

  const handlePitchComplete = async (data: any) => {
    try {
      if (!db) {
        console.error('Database not available');
        return;
      }
      
      // Save pitch data to Firestore with all required fields
      const pitchData = {
        ...data,
        // Core project data
        founderId: user?.uid,
        ownerId: user?.uid,  // Required by Firestore rules
        userId: user?.uid,   // Required by Firestore rules
        founderEmail: user?.email,
        founderName: user?.displayName || user?.email?.split('@')[0] || 'Founder',
        
        // Ensure required fields exist
        title: data.title || data.name || 'Untitled Project',
        name: data.name || data.title || 'Untitled Project',
        description: data.description || data.solution || data.tagline || 'No description available',
        
        // Status and metadata
        status: 'pending',
        
        // CRITICAL: Target roles for filtering - ensures projects appear in all role dashboards
        targetRoles: ['vc', 'exchange', 'ido', 'marketing', 'influencer'],
        
        // Pitch submission tracking
        pitch: {
          submitted: true,
          submittedAt: new Date().toISOString()
        },
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to projects collection
      const docRef = await addDoc(collection(db!, 'projects'), pitchData);
      
      console.log('Pitch submitted successfully:', docRef.id);
      
      // Redirect to dashboard
      router.push('/founder/dashboard');
    } catch (error) {
      console.error('Error submitting pitch:', error);
    }
  };

  return <ProjectPitchWizard onComplete={handlePitchComplete} />;
}
