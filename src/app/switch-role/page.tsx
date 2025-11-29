"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { doc, updateDoc, serverTimestamp } from '@/lib/firebase.client';
import { auth, db } from '@/lib/firebase.client';

const roles = [
  { id: 'founder', name: 'Founder', description: 'Launch and pitch your crypto project', icon: '🚀' },
  { id: 'vc', name: 'VC', description: 'Invest in promising blockchain projects', icon: '💼' },
  { id: 'exchange', name: 'Exchange', description: 'List and trade crypto assets', icon: '🏛️' },
  { id: 'ido', name: 'IDO Launchpad', description: 'Launch token sales and IDOs', icon: '🎯' },
  { id: 'influencer', name: 'Influencer', description: 'Promote projects and earn rewards', icon: '📢' },
  { id: 'agency', name: 'Agency', description: 'Provide marketing and advisory services', icon: '🎨' },
  { id: 'admin', name: 'Admin', description: 'Manage platform operations', icon: '⚙️' }
];

export default function SwitchRole() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleRoleSwitch = async (newRole: string) => {
    if (!user) return;
    
    setSwitching(true);
    try {
      if (!db) return;
      // Update user role in Firestore
      const userDoc = doc(db!, 'users', user.uid);
      await updateDoc(userDoc, {
        role: newRole,
        roleSwitchedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });

      // Redirect to new role dashboard
      router.push(`/${newRole}/dashboard`);
    } catch (error) {
      console.error('Error switching role:', error);
      alert('Failed to switch role. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Switch Role</h1>
          <p className="text-white/70 text-lg">
            Choose your role to access the appropriate dashboard and tools.
          </p>
          <p className="text-white/50 text-sm mt-2">
            Current role: <span className="text-blue-400 font-medium">{role}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((roleOption) => (
            <button
              key={roleOption.id}
              onClick={() => handleRoleSwitch(roleOption.id)}
              disabled={switching || roleOption.id === role}
              className={`p-6 rounded-xl border transition-all duration-300 text-left ${
                roleOption.id === role
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-black border-white/20 text-white hover:border-white/40 hover:bg-white/5'
              } ${switching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-3xl mb-4">{roleOption.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{roleOption.name}</h3>
              <p className="text-white/70 text-sm">{roleOption.description}</p>
              {roleOption.id === role && (
                <div className="mt-4 text-blue-200 text-sm font-medium">
                  Current Role
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 text-white/70 hover:text-white transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
