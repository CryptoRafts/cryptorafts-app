"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import RoleGate from "@/components/RoleGate";

interface Note {
  id: string;
  title: string;
  content: string;
  category: 'due_diligence' | 'market_research' | 'team_analysis' | 'financial_models';
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'archived';
  projectId?: string;
  projectName?: string;
  wordCount: number;
  attachmentCount: number;
  createdAt: any;
  updatedAt: any;
  userId: string;
}

export default function VCNotesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'due_diligence' as const,
    priority: 'medium' as const
  });

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        setDataLoading(false);
        return;
      }

      try {
        const dbInstance = ensureDb();
        // Real-time notes subscription
        const notesQuery = query(
          collection(dbInstance, 'notes'),
          where('userId', '==', user.uid),
          orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
          const notesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Note[];
          setNotes(notesData);
          setFilteredNotes(notesData);
          setDataLoading(false);
        }, createSnapshotErrorHandler('VC notes'));

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setDataLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user]);

  useEffect(() => {
    let filtered = notes;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    setFilteredNotes(filtered);
  }, [notes, selectedCategory]);

  const handleCreateNote = async () => {
    if (!user || !newNote.title || !newNote.content) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      await addDoc(collection(dbInstance, 'notes'), {
        ...newNote,
        wordCount: newNote.content.split(' ').length,
        attachmentCount: 0,
        status: 'active',
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setNewNote({ title: '', content: '', category: 'due_diligence', priority: 'medium' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleViewNote = (noteId: string) => {
    router.push(`/vc/notes/${noteId}`);
  };

  const handleArchiveNote = async (noteId: string) => {
    if (!user) return;
    
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) return;
      
      await updateDoc(doc(dbInstance, 'notes', noteId), {
        status: 'archived',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error archiving note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    if (!user) return;
    
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) return;
      
      await deleteDoc(doc(dbInstance, 'notes', noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'due_diligence': return '🔍';
      case 'market_research': return '📊';
      case 'team_analysis': return '👥';
      case 'financial_models': return '💰';
      default: return '📝';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'archived': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  const categories = [
    { id: 'all', label: 'All Notes', icon: '📝' },
    { id: 'due_diligence', label: 'Due Diligence', icon: '🔍' },
    { id: 'market_research', label: 'Market Research', icon: '📊' },
    { id: 'team_analysis', label: 'Team Analysis', icon: '👥' },
    { id: 'financial_models', label: 'Financial Models', icon: '💰' }
  ];

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGate requiredRole="vc">
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Investment Notes</h1>
            <p className="text-white/80 text-lg">Track your research and due diligence notes</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center space-x-3 ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* All Notes */}
            <div className="lg:col-span-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">All Notes</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                  >
                    Create Note
                  </button>
                </div>

                <div className="space-y-4">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => (
                      <div key={note.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getCategoryIcon(note.category)}</span>
                            <div>
                              <h3 className="text-white font-medium">{note.title}</h3>
                              <p className="text-white/70 text-sm">
                                {categories.find(c => c.id === note.category)?.label} • Updated {formatDate(note.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(note.priority)}`}>
                              {note.priority === 'high' ? 'High Priority' : 
                               note.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                            </span>
                            {note.status === 'archived' && (
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(note.status)}`}>
                                Archived
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-white/70 text-sm mb-3 line-clamp-3">
                          {note.content}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-4 text-sm text-white/60">
                            <span>{note.wordCount.toLocaleString()} words</span>
                            <span>{note.attachmentCount} attachments</span>
                            {note.projectName && <span>• {note.projectName}</span>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewNote(note.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all"
                            >
                              View Note
                            </button>
                            <div className="relative group">
                              <button className="px-2 py-1 text-white/60 hover:text-white">
                                ⋮
                              </button>
                              <div className="absolute right-0 top-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleArchiveNote(note.id)}
                                  className="block w-full text-left px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded text-sm"
                                >
                                  {note.status === 'archived' ? 'Unarchive' : 'Archive'}
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-white/70 text-lg mb-4">No notes found</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                      >
                        Create Your First Note
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Create Note Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-white">Create New Note</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Title</label>
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      placeholder="Enter note title..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Category</label>
                      <select
                        value={newNote.category}
                        onChange={(e) => setNewNote({...newNote, category: e.target.value as any})}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="due_diligence">Due Diligence</option>
                        <option value="market_research">Market Research</option>
                        <option value="team_analysis">Team Analysis</option>
                        <option value="financial_models">Financial Models</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Priority</label>
                      <select
                        value={newNote.priority}
                        onChange={(e) => setNewNote({...newNote, priority: e.target.value as any})}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">Content</label>
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      placeholder="Write your note content here..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateNote}
                      disabled={!newNote.title || !newNote.content}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                    >
                      Create Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}
