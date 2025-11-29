"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { auth, db, doc, setDoc } from "@/lib/firebase.client";
import AnimatedButton from "@/components/ui/AnimatedButton";
import BlockchainCard from "@/components/ui/BlockchainCard";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Role {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  locked?: boolean;
  lockedMessage?: string;
}

const roleOptions: Role[] = [
  {
    id: "founder",
    name: "Founder",
    description: "Launch and grow your crypto project",
    icon: <NeonCyanIcon type="rocket" size={32} className="text-current" />,
    color: "from-blue-500 to-purple-600",
    features: ["Project Dashboard", "Pitch Creation", "Funding Rounds", "Team Management"]
  },
  {
    id: "vc",
    name: "Venture Capitalist",
    description: "Invest in promising crypto projects",
    icon: <NeonCyanIcon type="dollar" size={32} className="text-current" />,
    color: "from-green-500 to-emerald-600",
    features: ["Deal Flow", "Portfolio Management", "Due Diligence", "Investment Tracking"]
  },
  {
    id: "exchange",
    name: "Exchange",
    description: "List and trade crypto assets",
    icon: <NeonCyanIcon type="globe" size={32} className="text-current" />,
    color: "from-orange-500 to-red-600",
    features: ["Asset Listings", "Trading Pairs", "Liquidity Management", "Compliance"]
  },
  {
    id: "ido",
    name: "IDO Launchpad",
    description: "Launch token sales and IDOs",
    icon: <NeonCyanIcon type="lightbulb" size={32} className="text-current" />,
    color: "from-yellow-500 to-orange-600",
    features: ["Token Launches", "IDO Management", "Investor Relations", "Compliance"]
  },
  {
    id: "agency",
    name: "Marketing Agency",
    description: "Provide services to crypto projects",
    icon: <NeonCyanIcon type="users" size={32} className="text-current" />,
    color: "from-purple-500 to-pink-600",
    features: ["Campaign Management", "Content Creation", "Community Building", "Analytics"]
  },
  {
    id: "influencer",
    name: "Influencer",
    description: "Promote and market crypto projects",
    icon: <NeonCyanIcon type="megaphone" size={32} className="text-current" />,
    color: "from-pink-500 to-rose-600",
    features: ["Content Creation", "Social Media", "Campaigns", "Analytics"]
  }
];

export default function RoleChooser() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleRoleSelect = async (roleId: string) => {
    if (!user) {
      setError("You must be logged in to select a role");
      return;
    }

    // Check if role is locked
    const role = roleOptions.find(r => r.id === roleId);
    if (role?.locked) {
      setError(`${role.name} role is currently locked. ${role.lockedMessage || 'Please contact support.'}`);
      return;
    }

    setSelectedRole(roleId);
    setIsLoading(true);
    setError("");

    try {
      console.log('🎯 Selecting role:', roleId, 'for user:', user.uid);
      
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      // Store role directly in Firestore with enhanced data
      await setDoc(doc(firestore, 'users', user.uid), {
        role: roleId,
        onboardingStep: 'start',
        profileCompleted: false,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }, { merge: true });

      console.log('✅ Role saved to Firestore');

      // Save role to localStorage for quick access
      localStorage.setItem('userRole', roleId);
      localStorage.setItem('userClaims', JSON.stringify({ role: roleId }));
      
      console.log('✅ Role saved to localStorage');
      
      // Force token refresh to get new claims (if Admin SDK sets them)
      try {
        await user.getIdToken(true);
        console.log('✅ Token refreshed');
      } catch (tokenError) {
        console.warn("⚠️ Token refresh warning:", tokenError);
        // Continue anyway - we have the role in Firestore
      }
      
      // Small delay to ensure Firestore write completes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🚀 Redirecting to dashboard...');
      
      // Force a full page reload to ensure AuthProvider picks up the new role
      window.location.href = `/${roleId}/dashboard`;
      
    } catch (error: any) {
      console.error("❌ Role selection error:", error);
      setError(error.message || "Failed to select role. Please try again.");
      setSelectedRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen neo-blue-background">
      <div className="container-responsive py-responsive-xl">
        {/* Perfect Header */}
        <div className="text-center mb-responsive-xl">
          <h1 className="text-responsive-5xl font-bold text-white mb-responsive-md">
            Choose Your Role
          </h1>
          <p className="text-responsive-xl text-white/80 max-w-4xl mx-auto">
            Select your role to access the platform. This choice determines your access and permissions.
          </p>
        </div>

        {/* Perfect Error Display */}
        {error && (
          <div className="glass-card border border-red-500/20 rounded-xl p-responsive-md mb-responsive-lg max-w-2xl mx-auto">
            <div className="text-red-400 text-center text-responsive-base">
              {error}
            </div>
          </div>
        )}

        {/* Perfect Role Options Grid */}
        <div className="grid-responsive grid-multi-desktop gap-responsive-lg mb-responsive-lg">
          {roleOptions.map((role) => (
            <div
              key={role.id}
              onClick={() => !role.locked && handleRoleSelect(role.id)}
              className={`relative glass-card rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                role.locked 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'cursor-pointer hover:scale-105 hover:shadow-2xl'
              } ${
                selectedRole === role.id 
                  ? 'border-blue-500 shadow-blue-500/25' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Perfect Locked Badge */}
              {role.locked && (
                <div className="absolute top-responsive-sm right-responsive-sm z-10">
                  <div className="bg-red-500/90 text-white text-responsive-xs font-bold px-responsive-xs py-1 rounded-full flex items-center gap-responsive-xs">
                    🔒 {role.lockedMessage || 'Locked'}
                  </div>
                </div>
              )}
              
              <div className="p-responsive-md">
                {/* Perfect Role Icon */}
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${role.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-responsive-md shadow-lg`}>
                  <div className="text-white icon-responsive-lg">
                    {role.icon}
                  </div>
                </div>

                {/* Perfect Role Info */}
                <h3 className="text-responsive-xl font-bold text-white mb-responsive-xs">{role.name}</h3>
                <p className="text-white/70 text-responsive-sm mb-responsive-md">{role.description}</p>

                {/* Perfect Features */}
                <div className="space-responsive-xs">
                  {role.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-responsive-xs">
                      <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                      <span className="text-white/60 text-responsive-xs">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Perfect Loading Overlay */}
                {isLoading && selectedRole === role.id && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
