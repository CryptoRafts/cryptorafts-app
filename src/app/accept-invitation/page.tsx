'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import BlockchainCard from "@/components/ui/BlockchainCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import StandardLoading from "@/components/ui/StandardLoading";
import { 
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface InvitationData {
  id: string;
  email: string;
  inviterName: string;
  inviterEmail: string;
  teamType: string;
  role: string;
  expiresAt: string;
  isValid: boolean;
}

export default function AcceptInvitationPage() {
  const { user, isLoading: authLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [validating, setValidating] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setValidating(false);
      return;
    }

    validateInvitation(token);
  }, [token]);

  const validateInvitation = async (invitationToken: string) => {
    setValidating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/team/invitation/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: invitationToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInvitation({
          id: data.invitation.id,
          email: data.invitation.email,
          inviterName: data.invitation.inviterName,
          inviterEmail: data.invitation.inviterEmail,
          teamType: data.invitation.teamType,
          role: data.invitation.role,
          expiresAt: data.invitation.expiresAt,
          isValid: true,
        });
      } else {
        setError(data.error || 'Invalid or expired invitation');
        setInvitation(null);
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
      setError('Failed to validate invitation. Please try again.');
      setInvitation(null);
    } finally {
      setValidating(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token || !invitation) return;

    // If user is not logged in, redirect to login with invitation token
    if (!user) {
      // Store invitation token in sessionStorage for after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingInvitationToken', token);
      }
      router.push(`/login?invitation=${token}&email=${encodeURIComponent(invitation.email)}`);
      return;
    }

    // If user is logged in, process the invitation
    await processInvitation(token, user.email || '');
  };

  const processInvitation = async (invitationToken: string, userEmail: string) => {
    setProcessing(true);
    setError(null);

    try {
      // Get user's Firebase token
      const firebaseAuth = await import('firebase/auth');
      const { getAuth } = firebaseAuth;
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/team/invitation/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token: invitationToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear pending invitation from sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingInvitationToken');
        }

        // Redirect based on team type
        const redirectPath = getRedirectPath(data.invitation.teamType);
        router.push(redirectPath);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getRedirectPath = (teamType: string): string => {
    const pathMap: Record<string, string> = {
      vc: '/vc/dashboard',
      founder: '/founder/dashboard',
      exchange: '/exchange/dashboard',
      ido: '/ido/dashboard',
      influencer: '/influencer/dashboard',
      agency: '/agency/dashboard',
    };
    return pathMap[teamType] || '/dashboard';
  };

  if (authLoading || validating) {
    return (
      <div className="min-h-screen relative neo-blue-background">
        <div className="container-perfect relative z-10 flex items-center justify-center">
          <StandardLoading 
            title="Validating Invitation" 
            message="Checking your invitation..." 
          />
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen relative neo-blue-background">
        <div className="container-perfect relative z-10 flex items-center justify-center">
          <div className="max-w-md w-full">
            <BlockchainCard variant="default" size="lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-4">Invalid Invitation</h1>
                <p className="text-white/70 mb-6">{error}</p>
                
                <AnimatedButton
                  variant="primary"
                  size="md"
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Go to Login
                </AnimatedButton>
              </div>
            </BlockchainCard>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const teamTypeName = invitation.teamType.toUpperCase();
  const roleName = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);

  return (
    <div className="min-h-screen relative neo-blue-background">
      <div className="container-perfect relative z-10 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Team Invitation</h1>
            <p className="text-white/60 text-lg">You've been invited to join a {teamTypeName} team</p>
          </div>

          {/* Invitation Details */}
          <BlockchainCard variant="default" size="lg" className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Invitation Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-white/60 text-sm">Invited by:</span>
                  <p className="text-white font-medium">{invitation.inviterName}</p>
                  <p className="text-white/60 text-sm">{invitation.inviterEmail}</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Team Type:</span>
                  <p className="text-white font-medium">{teamTypeName}</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Your Role:</span>
                  <p className="text-white font-medium">{roleName}</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Email:</span>
                  <p className="text-white font-medium">{invitation.email}</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-white/80 text-sm">
                  <strong>Next Steps:</strong>
                </p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-white/60 text-sm">
                  <li>Sign in with your Google account using <strong className="text-white">{invitation.email}</strong></li>
                  <li>Complete your profile setup</li>
                  <li>You'll automatically be added to the team</li>
                </ol>
              </div>
            </div>
          </BlockchainCard>

          {/* Action Buttons */}
          <div className="space-y-4">
            {user ? (
              <>
                {user.email?.toLowerCase() === invitation.email.toLowerCase() ? (
                  <AnimatedButton
                    variant="primary"
                    size="lg"
                    onClick={() => processInvitation(token || '', user.email || '')}
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? 'Processing...' : 'Accept Invitation & Join Team'}
                  </AnimatedButton>
                ) : (
                  <div className="text-center">
                    <p className="text-white/70 mb-4">
                      You're signed in as <strong>{user.email}</strong>, but this invitation is for <strong>{invitation.email}</strong>
                    </p>
                    <AnimatedButton
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        // Sign out and redirect to login with invitation
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('pendingInvitationToken', token || '');
                        }
                        router.push(`/login?invitation=${token}&email=${encodeURIComponent(invitation.email)}`);
                      }}
                      className="w-full"
                    >
                      Sign Out & Use Invited Email
                    </AnimatedButton>
                  </div>
                )}
              </>
            ) : (
              <AnimatedButton
                variant="primary"
                size="lg"
                onClick={handleAcceptInvitation}
                className="w-full flex items-center justify-center space-x-2"
              >
                <span>Sign In with Google to Accept</span>
                <ArrowRightIcon className="w-5 h-5" />
              </AnimatedButton>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

