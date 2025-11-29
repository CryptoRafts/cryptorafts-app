"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { db, doc, getDoc, setDoc } from "@/lib/firebase.client";
import { useRouter } from "next/navigation";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import { 
  UserIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CogIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    linkedin: '',
    twitter: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadUserData();
    }
  }, [user, loading, router]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      if (!db) return;
      const userDoc = await getDoc(doc(db!, 'users', user!.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setFormData({
          displayName: data.displayName || data.display_name || user!.displayName || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!db) return;
      await setDoc(doc(db!, 'users', user!.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setUserData((prev: any) => ({ ...prev, ...formData }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      founder: 'Founder',
      vc: 'Venture Capital',
      exchange: 'Exchange',
      ido: 'IDO Launchpad',
      influencer: 'Influencer',
      agency: 'Agency',
      admin: 'Administrator'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'founder':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'vc':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'exchange':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ido':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'influencer':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'agency':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'admin':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-white/70 text-lg">Manage your profile information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="neo-glass-card rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Profile Picture
              </h2>
              
              <ProfilePictureUploader
                uid={user.uid}
                currentImageUrl={userData?.photoURL || user.photoURL}
                onUploadComplete={(url) => {
                  setUserData((prev: any) => ({ ...prev, photoURL: url }));
                }}
                size="lg"
                showLabel={false}
              />
              
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white font-semibold text-sm mb-2">Profile Tips</h3>
                <ul className="text-white/70 text-xs space-y-1">
                  <li>• Use a clear, professional photo</li>
                  <li>• Square images work best</li>
                  <li>• Max file size: 5MB</li>
                  <li>• Supported formats: JPG, PNG</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="neo-glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Basic Information
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-outline btn-sm"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  ) : (
                    <p className="text-white font-semibold">
                      {userData?.displayName || userData?.display_name || user.displayName || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-white/50" />
                    <p className="text-white">{user.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Role
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getRoleColor(userData?.role || 'user')}`}>
                    {getRoleDisplayName(userData?.role || 'user')}
                  </span>
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Member Since
                  </label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-white/50" />
                    <p className="text-white">
                      {user.metadata?.creationTime ? 
                        new Date(user.metadata.creationTime).toLocaleDateString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    className="btn-success"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      loadUserData(); // Reset form data
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="neo-glass-card rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5" />
                Additional Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-white/80">
                      {userData?.bio || 'No bio provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="City, Country"
                    />
                  ) : (
                    <p className="text-white/80">
                      {userData?.location || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Website
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="https://example.com"
                    />
                  ) : (
                    <p className="text-white/80">
                      {userData?.website ? (
                        <a href={userData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          {userData.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    LinkedIn
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="https://linkedin.com/in/username"
                    />
                  ) : (
                    <p className="text-white/80">
                      {userData?.linkedin ? (
                        <a href={userData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          {userData.linkedin}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="neo-glass-card rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5" />
                Account Status
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <h3 className="text-white font-semibold">Email Verification</h3>
                    <p className="text-white/60 text-sm">Your email address is verified</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-bold">
                    ✓ Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <h3 className="text-white font-semibold">KYC Status</h3>
                    <p className="text-white/60 text-sm">
                      {userData?.kyc?.status === 'approved' ? 'Identity verified' : 'Pending verification'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 border rounded-full text-sm font-bold ${
                    userData?.kyc?.status === 'approved' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {userData?.kyc?.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
