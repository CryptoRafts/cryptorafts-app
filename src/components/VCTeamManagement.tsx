"use client";

import React, { useState, useEffect } from 'react';
import BlockchainCard from './ui/BlockchainCard';
import AnimatedButton from './ui/AnimatedButton';
import { 
  UserPlusIcon, 
  UserGroupIcon, 
  TrashIcon, 
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  position: string;
  department: string;
  phone?: string;
  joinedAt: Date;
  isActive: boolean;
  permissions: {
    canViewProjects: boolean;
    canAcceptProjects: boolean;
    canManageTeam: boolean;
    canAccessAnalytics: boolean;
  };
}

interface VCTeamManagementProps {
  orgId: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

const VCTeamManagement: React.FC<VCTeamManagementProps> = ({ orgId, currentUser }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockMembers: TeamMember[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@cryptorafts.com',
        role: 'admin',
        position: 'Investment Director',
        department: 'Investment',
        phone: '+1 (555) 123-4567',
        joinedAt: new Date('2023-01-15'),
        isActive: true,
        permissions: {
          canViewProjects: true,
          canAcceptProjects: true,
          canManageTeam: true,
          canAccessAnalytics: true,
        }
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael.chen@cryptorafts.com',
        role: 'member',
        position: 'Senior Analyst',
        department: 'Research',
        phone: '+1 (555) 234-5678',
        joinedAt: new Date('2023-03-20'),
        isActive: true,
        permissions: {
          canViewProjects: true,
          canAcceptProjects: false,
          canManageTeam: false,
          canAccessAnalytics: true,
        }
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@cryptorafts.com',
        role: 'viewer',
        position: 'Research Associate',
        department: 'Research',
        phone: '+1 (555) 345-6789',
        joinedAt: new Date('2023-06-10'),
        isActive: true,
        permissions: {
          canViewProjects: true,
          canAcceptProjects: false,
          canManageTeam: false,
          canAccessAnalytics: false,
        }
      },
      {
        id: '4',
        name: 'David Kim',
        email: 'david.kim@cryptorafts.com',
        role: 'member',
        position: 'Due Diligence Manager',
        department: 'Operations',
        phone: '+1 (555) 456-7890',
        joinedAt: new Date('2023-08-05'),
        isActive: false,
        permissions: {
          canViewProjects: true,
          canAcceptProjects: true,
          canManageTeam: false,
          canAccessAnalytics: true,
        }
      }
    ];

    setTeamMembers(mockMembers);
  }, []);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddMember = () => {
    setSelectedMember(null);
    setShowAddMemberModal(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEditMemberModal(true);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    }
  };

  const handleToggleMemberStatus = async (memberId: string) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, isActive: !member.isActive }
        : member
    ));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'member': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'viewer': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <BlockchainCard variant="default" className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Team Management</h1>
            <p className="text-white/60">Manage your VC team members and permissions</p>
          </div>
          <AnimatedButton
            variant="primary"
            size="md"
            onClick={handleAddMember}
            icon={<UserPlusIcon className="w-5 h-5" />}
          >
            Add Team Member
          </AnimatedButton>
        </div>
      </BlockchainCard>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <BlockchainCard variant="default" size="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-white/60 text-sm mb-1">Total Members</p>
              <p className="text-2xl font-bold text-white">{teamMembers.length}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-400 flex-shrink-0" />
          </div>
          <div className="flex items-center text-green-400 text-sm">
            <span>Team Size</span>
          </div>
        </BlockchainCard>

        <BlockchainCard variant="default" size="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-white/60 text-sm mb-1">Active Members</p>
              <p className="text-2xl font-bold text-white">{teamMembers.filter(m => m.isActive).length}</p>
            </div>
            <ShieldCheckIcon className="h-8 w-8 text-green-400 flex-shrink-0" />
          </div>
          <div className="flex items-center text-green-400 text-sm">
            <span>Currently Active</span>
          </div>
        </BlockchainCard>

        <BlockchainCard variant="default" size="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-white/60 text-sm mb-1">Admins</p>
              <p className="text-2xl font-bold text-white">{teamMembers.filter(m => m.role === 'admin').length}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-red-400 flex-shrink-0" />
          </div>
          <div className="flex items-center text-green-400 text-sm">
            <span>Administrators</span>
          </div>
        </BlockchainCard>

        <BlockchainCard variant="default" size="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-white/60 text-sm mb-1">Departments</p>
              <p className="text-2xl font-bold text-white">{new Set(teamMembers.map(m => m.department)).size}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-purple-400 flex-shrink-0" />
          </div>
          <div className="flex items-center text-green-400 text-sm">
            <span>Different Departments</span>
          </div>
        </BlockchainCard>
      </div>

      {/* Filters */}
      <BlockchainCard variant="default" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Status</label>
            <select className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </BlockchainCard>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMembers.map((member) => (
          <BlockchainCard key={member.id} variant="default" size="lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                  <p className="text-white/60 text-sm">{member.position}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                  {member.role}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.isActive)}`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-white/70 text-sm">
                <EnvelopeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center text-white/70 text-sm">
                  <PhoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{member.phone}</span>
                </div>
              )}
              <div className="flex items-center text-white/70 text-sm">
                <BuildingOfficeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{member.department}</span>
              </div>
              <div className="flex items-center text-white/70 text-sm">
                <span>Joined: {member.joinedAt.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Permissions */}
            <div className="mb-4">
              <h4 className="text-white/80 text-sm font-medium mb-2">Permissions</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(member.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-400' : 'bg-gray-400'}`} />
                    <span className="text-white/60 capitalize">
                      {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={() => handleEditMember(member)}
                icon={<PencilIcon className="w-4 h-4" />}
                className="flex-1"
              >
                Edit
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={() => handleToggleMemberStatus(member.id)}
                className="flex-1"
              >
                {member.isActive ? 'Deactivate' : 'Activate'}
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={() => handleRemoveMember(member.id)}
                icon={<TrashIcon className="w-4 h-4" />}
                className="flex-1"
              >
                Remove
              </AnimatedButton>
            </div>
          </BlockchainCard>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <BlockchainCard variant="default" className="text-center py-12">
          <UserGroupIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Team Members Found</h3>
          <p className="text-white/60 mb-6">No team members match your current filters.</p>
          <AnimatedButton
            variant="primary"
            size="md"
            onClick={handleAddMember}
            icon={<UserPlusIcon className="w-5 h-5" />}
          >
            Add First Team Member
          </AnimatedButton>
        </BlockchainCard>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          onClose={() => setShowAddMemberModal(false)}
          onSave={(memberData) => {
            const newMember: TeamMember = {
              id: Date.now().toString(),
              ...memberData,
              joinedAt: new Date(),
              isActive: true,
              permissions: {
                canViewProjects: true,
                canAcceptProjects: memberData.role === 'admin' || memberData.role === 'member',
                canManageTeam: memberData.role === 'admin',
                canAccessAnalytics: memberData.role === 'admin' || memberData.role === 'member',
              }
            };
            setTeamMembers(prev => [...prev, newMember]);
            setShowAddMemberModal(false);
          }}
        />
      )}

      {/* Edit Member Modal */}
      {showEditMemberModal && selectedMember && (
        <EditMemberModal
          member={selectedMember}
          onClose={() => setShowEditMemberModal(false)}
          onSave={(memberData) => {
            setTeamMembers(prev => prev.map(member => 
              member.id === selectedMember.id 
                ? { ...member, ...memberData, permissions: {
                    canViewProjects: true,
                    canAcceptProjects: memberData.role === 'admin' || memberData.role === 'member',
                    canManageTeam: memberData.role === 'admin',
                    canAccessAnalytics: memberData.role === 'admin' || memberData.role === 'member',
                  }}
                : member
            ));
            setShowEditMemberModal(false);
          }}
        />
      )}
    </div>
  );
};

// Add Member Modal Component
interface AddMemberModalProps {
  onClose: () => void;
  onSave: (memberData: Omit<TeamMember, 'id' | 'joinedAt' | 'isActive' | 'permissions'>) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member' as 'admin' | 'member' | 'viewer',
    position: '',
    department: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.position && formData.department) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="neo-glass-card rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Add Team Member</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Position *</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="e.g., Senior Analyst"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Department *</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="e.g., Research"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <AnimatedButton
              type="button"
              variant="primary"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              type="submit"
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Add Member
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Member Modal Component
interface EditMemberModalProps {
  member: TeamMember;
  onClose: () => void;
  onSave: (memberData: Partial<TeamMember>) => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: member.name,
    email: member.email,
    role: member.role,
    position: member.position,
    department: member.department,
    phone: member.phone || '',
    isActive: member.isActive
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="neo-glass-card rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Team Member</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Position *</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Department *</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-white/70 text-sm">Active Member</label>
          </div>

          <div className="flex space-x-3 pt-4">
            <AnimatedButton
              type="button"
              variant="primary"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              type="submit"
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Save Changes
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VCTeamManagement;
