"use client";

import React, { useState, useEffect } from 'react';
import { db, collection, doc, setDoc, getDocs, deleteDoc, query, where } from '@/lib/firebase.client';
import { UsersIcon, PlusIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { logTeamChange } from '@/lib/admin/audit';

export interface TeamMember {
  id: string;
  email: string;
  department: string;
  role: 'member' | 'lead' | 'admin';
  status: 'invited' | 'active' | 'inactive';
  invitedAt: string;
  invitedBy: string;
  joinedAt?: string;
  permissions?: string[];
}

interface TeamManagerProps {
  userId: string;
  userEmail: string;
}

const DEPARTMENTS = [
  { id: 'kyc', name: 'KYC Verification' },
  { id: 'kyb', name: 'KYB Verification' },
  { id: 'spotlight', name: 'Spotlight Management' },
  { id: 'finance', name: 'Finance' },
  { id: 'support', name: 'Support' },
  { id: 'operations', name: 'Operations' }
];

export default function TeamManager({ userId, userEmail }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  
  useEffect(() => {
    loadMembers();
  }, []);
  
  const loadMembers = async () => {
    if (!db) return;
    
    try {
      const snapshot = await getDocs(collection(db!, 'department_members'));
      const loadedMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
      setMembers(loadedMembers);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load team members:', error);
      setIsLoading(false);
    }
  };
  
  const inviteMember = async (email: string, department: string, role: TeamMember['role']) => {
    if (!db) return;
    
    // Validate email is Gmail
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      alert('❌ Only Gmail accounts are allowed');
      return;
    }
    
    try {
      const memberId = `member-${Date.now()}`;
      const memberData: TeamMember = {
        id: memberId,
        email: email.toLowerCase(),
        department,
        role,
        status: 'invited',
        invitedAt: new Date().toISOString(),
        invitedBy: userId
      };
      
      await setDoc(doc(db!, 'department_members', memberId), memberData);
      
      // Log to audit
      await logTeamChange(userId, userEmail, 'team.member.add', memberId, memberData);
      
      await loadMembers();
      setShowInviteForm(false);
      alert(`✅ Invitation sent to ${email}`);
    } catch (error) {
      console.error('Failed to invite member:', error);
      alert('❌ Failed to send invitation');
    }
  };
  
  const removeMember = async (memberId: string, memberEmail: string) => {
    if (!db || !confirm(`Remove ${memberEmail} from team?`)) return;
    
    try {
      await deleteDoc(doc(db!, 'department_members', memberId));
      await logTeamChange(userId, userEmail, 'team.member.remove', memberId);
      await loadMembers();
      alert('✅ Member removed');
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('❌ Failed to remove member');
    }
  };
  
  const updateMemberRole = async (memberId: string, newRole: TeamMember['role']) => {
    if (!db) return;
    
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;
      
      await setDoc(doc(db!, 'department_members', memberId), {
        ...member,
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      await logTeamChange(userId, userEmail, 'team.member.update', memberId, { role: newRole });
      await loadMembers();
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };
  
  const filteredMembers = filterDepartment === 'all'
    ? members
    : members.filter(m => m.department === filterDepartment);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-bold flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-purple-400" />
          Team Management
        </h2>
        <button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Invite Member
        </button>
      </div>
      
      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-white/70 text-sm">Filter:</span>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>
      
      {isLoading ? (
        <div className="text-white/60">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold">{member.email}</h3>
                  {member.status === 'invited' && (
                    <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                      Pending
                    </span>
                  )}
                  {member.status === 'active' && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/60 text-sm">
                    {DEPARTMENTS.find(d => d.id === member.department)?.name || member.department}
                  </span>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-white/60 text-sm capitalize">{member.role}</span>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-white/40 text-xs">
                    Invited {new Date(member.invitedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) => updateMemberRole(member.id, e.target.value as TeamMember['role'])}
                  className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                >
                  <option value="member">Member</option>
                  <option value="lead">Lead</option>
                  <option value="admin">Admin</option>
                </select>
                
                <button
                  onClick={() => removeMember(member.id, member.email)}
                  className="p-2 text-red-400 hover:text-red-300"
                  title="Remove member"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          
          {filteredMembers.length === 0 && (
            <div className="text-white/40 text-center py-8">
              No team members found
            </div>
          )}
        </div>
      )}
      
      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-white text-xl font-bold mb-4">Invite Team Member</h3>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                inviteMember(
                  formData.get('email') as string,
                  formData.get('department') as string,
                  formData.get('role') as TeamMember['role']
                );
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-white text-sm block mb-1">
                  Gmail Address * <span className="text-white/50">(only @gmail.com)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="user@gmail.com"
                  required
                  pattern=".+@gmail\.com"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
              </div>
              
              <div>
                <label className="text-white text-sm block mb-1">Department *</label>
                <select
                  name="department"
                  required
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-white text-sm block mb-1">Role *</label>
                <select
                  name="role"
                  required
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                >
                  <option value="member">Member</option>
                  <option value="lead">Lead</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-sm text-white/70">
                <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
                Only invited Gmail accounts can sign in with Google to access their department.
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Send Invitation
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

