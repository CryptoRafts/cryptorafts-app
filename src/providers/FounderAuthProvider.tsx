"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { founderStateManager, FounderProfile, Project, DealRoom } from '@/lib/founder-state';

interface FounderAuthContextType {
  // User state
  user: any;
  
  // Profile state
  profile: FounderProfile | null;
  profileLoading: boolean;
  
  // Projects state
  projects: Project[];
  projectsLoading: boolean;
  
  // Deal rooms state
  dealRooms: DealRoom[];
  dealRoomsLoading: boolean;
  
  // Onboarding state
  currentStep: string;
  canProceed: boolean;
  progressPercentage: number;
  
  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<FounderProfile>) => Promise<void>;
  completeProfile: (data: any) => Promise<void>;
  completeKYC: (data: any) => Promise<void>;
  completeKYB: (data: any) => Promise<void>;
  skipKYB: () => Promise<void>;
  completePitch: (data: any) => Promise<void>;
  createProject: (data: any) => Promise<string>;
  refreshProjects: () => Promise<void>;
  refreshDealRooms: () => Promise<void>;
  
  // RaftAI
  analyzeKYC: (data: any) => Promise<any>;
  analyzePitch: (data: any) => Promise<any>;
}

const FounderAuthContext = createContext<FounderAuthContextType | undefined>(undefined);

export const useFounderAuth = () => {
  const context = useContext(FounderAuthContext);
  if (!context) {
    throw new Error('useFounderAuth must be used within a FounderAuthProvider');
  }
  return context;
};

interface FounderAuthProviderProps {
  children: ReactNode;
}

export default function FounderAuthProvider({ children }: FounderAuthProviderProps) {
  const { user, isAuthenticated, claims } = useAuth();
  
  // State
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [dealRooms, setDealRooms] = useState<DealRoom[]>([]);
  const [dealRoomsLoading, setDealRoomsLoading] = useState(false);
  
  // Load profile when user changes
  useEffect(() => {
    if (user && isAuthenticated && claims?.role === 'founder') {
      loadProfile();
    } else {
      setProfile(null);
      setProfileLoading(false);
      setProjects([]);
      setDealRooms([]);
    }
  }, [user, isAuthenticated, claims?.role]);
  
  // Load projects and deal rooms when profile loads
  useEffect(() => {
    if (profile) {
      loadProjects();
      loadDealRooms();
    }
  }, [profile]);
  
  const loadProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const profileData = await founderStateManager.getProfile(user.uid);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Set a default profile if loading fails
      const defaultProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        role: 'founder',
        onboardingStep: 'profile',
        profileCompleted: false,
        kycStatus: 'pending',
        kybStatus: 'pending',
        kybSkipped: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true
      };
      setProfile(defaultProfile);
    } finally {
      setProfileLoading(false);
    }
  };
  
  const loadProjects = async () => {
    if (!user) return;
    
    setProjectsLoading(true);
    try {
      const projectsData = await founderStateManager.getProjects(user.uid);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      // Don't show error to user, just set empty array
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };
  
  const loadDealRooms = async () => {
    if (!user) return;
    
    setDealRoomsLoading(true);
    try {
      const roomsData = await founderStateManager.getDealRooms(user.uid);
      setDealRooms(roomsData || []);
    } catch (error) {
      console.error('Error loading deal rooms:', error);
      // Don't show error to user, just set empty array
      setDealRooms([]);
    } finally {
      setDealRoomsLoading(false);
    }
  };
  
  // Actions
  const updateProfile = async (data: Partial<FounderProfile>) => {
    if (!user) throw new Error('No authenticated user');
    
    await founderStateManager.updateProfile(user.uid, data);
    await loadProfile(); // Refresh profile
  };
  
  const completeProfile = async (data: any) => {
    if (!user) throw new Error('No authenticated user');
    
    await founderStateManager.completeProfile(user.uid, data);
    await loadProfile();
  };
  
  const completeKYC = async (data: any) => {
    if (!user) throw new Error('No authenticated user');
    
    await founderStateManager.completeKYC(user.uid, data);
    await loadProfile();
  };
  
  const completeKYB = async (data: any) => {
    if (!user) throw new Error('No authenticated user');
    
    await founderStateManager.completeKYB(user.uid, data);
    await loadProfile();
  };
  
  const skipKYB = async () => {
    if (!user) throw new Error('No authenticated user');
    
    await founderStateManager.skipKYB(user.uid);
    await loadProfile();
  };
  
  const completePitch = async (data: any) => {
    if (!user) throw new Error('No authenticated user');
    
    await founderStateManager.completePitch(user.uid, data);
    await loadProfile();
    await loadProjects(); // Refresh projects
  };
  
  const createProject = async (data: any) => {
    if (!user) throw new Error('No authenticated user');
    
    const projectId = await founderStateManager.createProject(user.uid, data);
    await loadProjects(); // Refresh projects
    return projectId;
  };
  
  const refreshProjects = async () => {
    await loadProjects();
  };
  
  const refreshDealRooms = async () => {
    await loadDealRooms();
  };
  
  const analyzeKYC = async (data: any) => {
    return await founderStateManager.analyzeKYC(data);
  };
  
  const analyzePitch = async (data: any) => {
    return await founderStateManager.analyzePitch(data);
  };
  
  // Calculate onboarding progress
  const getOnboardingProgress = () => {
    if (!profile) {
      return { step: 'profile', percentage: 0, canProceed: false };
    }
    
    const steps = ['profile', 'kyc', 'kyb_decision', 'kyb', 'pitch', 'home'];
    const currentIndex = steps.indexOf(profile.onboardingStep);
    const percentage = Math.round((currentIndex / (steps.length - 1)) * 100);
    
    let canProceed = false;
    switch (profile.onboardingStep) {
      case 'profile':
        canProceed = profile.profileCompleted;
        break;
      case 'kyc':
        canProceed = profile.kycStatus === 'approved';
        break;
      case 'kyb_decision':
        canProceed = true; // Always can proceed (skip or complete)
        break;
      case 'kyb':
        canProceed = profile.kybStatus === 'approved' || profile.kybStatus === 'skipped';
        break;
      case 'pitch':
        canProceed = profile.pitch?.oneTime === true;
        break;
      case 'home':
        canProceed = true;
        break;
    }
    
    return {
      step: profile.onboardingStep,
      percentage,
      canProceed
    };
  };
  
  const progress = getOnboardingProgress();
  
  const value: FounderAuthContextType = {
    user,
    profile,
    profileLoading,
    projects,
    projectsLoading,
    dealRooms,
    dealRoomsLoading,
    currentStep: progress.step,
    canProceed: progress.canProceed,
    progressPercentage: progress.percentage,
    loadProfile,
    updateProfile,
    completeProfile,
    completeKYC,
    completeKYB,
    skipKYB,
    completePitch,
    createProject,
    refreshProjects,
    refreshDealRooms,
    analyzeKYC,
    analyzePitch
  };
  
  return (
    <FounderAuthContext.Provider value={value}>
      {children}
    </FounderAuthContext.Provider>
  );
}
