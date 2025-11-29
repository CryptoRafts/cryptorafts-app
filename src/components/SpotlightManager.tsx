"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase.client';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Spotlight {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface SpotlightManagerProps {
  className?: string;
}

export default function SpotlightManager({ className = '' }: SpotlightManagerProps) {
  const { user, claims } = useAuth();
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSpotlight, setEditingSpotlight] = useState<Spotlight | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    priority: 1,
    isActive: true
  });

  // Check if user is admin
  const isAdmin = claims?.role === 'admin' || localStorage.getItem('userRole') === 'admin';

  // Load spotlights
  useEffect(() => {
    if (!isAdmin) return;
    
    const loadSpotlights = async () => {
      if (!db) {
        console.error('Database not available for SpotlightManager');
        setSpotlights([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const dbInstance = db;
        const spotlightsRef = collection(dbInstance, 'spotlights');
        const q = query(spotlightsRef, orderBy('priority', 'desc'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const spotlightsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Spotlight[];
        
        setSpotlights(spotlightsData);
      } catch (error) {
        console.error('Error loading spotlights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSpotlights();
  }, [isAdmin]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    try {
      const dbInstance = db;
      const spotlightData = {
        ...formData,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingSpotlight) {
        // Update existing spotlight
        const spotlightRef = doc(dbInstance, 'spotlights', editingSpotlight.id);
        await updateDoc(spotlightRef, {
          ...spotlightData,
          updatedAt: new Date()
        });
      } else {
        // Create new spotlight
        await addDoc(collection(dbInstance, 'spotlights'), spotlightData);
      }

      // Reset form and reload data
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        priority: 1,
        isActive: true
      });
      setShowForm(false);
      setEditingSpotlight(null);
      
      // Reload spotlights
      const spotlightsRef = collection(dbInstance, 'spotlights');
      const q = query(spotlightsRef, orderBy('priority', 'desc'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const spotlightsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Spotlight[];
      setSpotlights(spotlightsData);
    } catch (error) {
      console.error('Error saving spotlight:', error);
    }
  };

  // Handle edit
  const handleEdit = (spotlight: Spotlight) => {
    setEditingSpotlight(spotlight);
    setFormData({
      title: spotlight.title,
      description: spotlight.description,
      imageUrl: spotlight.imageUrl,
      link: spotlight.link,
      priority: spotlight.priority,
      isActive: spotlight.isActive
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!db || !confirm('Are you sure you want to delete this spotlight?')) return;
    
    try {
      const dbInstance = db;
      await deleteDoc(doc(dbInstance, 'spotlights', id));
      setSpotlights(spotlights.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting spotlight:', error);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (spotlight: Spotlight) => {
    if (!db) return;

    try {
      const dbInstance = db;
      const spotlightRef = doc(dbInstance, 'spotlights', spotlight.id);
      await updateDoc(spotlightRef, {
        isActive: !spotlight.isActive,
        updatedAt: new Date()
      });
      
      setSpotlights(spotlights.map(s => 
        s.id === spotlight.id 
          ? { ...s, isActive: !s.isActive, updatedAt: new Date() }
          : s
      ));
    } catch (error) {
      console.error('Error updating spotlight:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-white/60">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="text-white/60 mt-2">Loading spotlights...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <NeonCyanIcon type="star" size={24} className="text-yellow-400" />
            Spotlight Management
          </h2>
          <p className="text-white/60">Manage featured content and spotlights</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingSpotlight(null);
            setFormData({
              title: '',
              description: '',
              imageUrl: '',
              link: '',
              priority: 1,
              isActive: true
            });
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Add Spotlight
        </button>
      </div>

      {/* Spotlight Form */}
      {showForm && (
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingSpotlight ? 'Edit Spotlight' : 'Create New Spotlight'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingSpotlight(null);
              }}
              className="text-white/60 hover:text-white"
            >
              <NeonCyanIcon type="close" size={20} className="text-current" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter spotlight title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter spotlight description"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Link URL
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/5 border-white/10 rounded focus:ring-blue-500"
                />
                <span className="text-white/80">Active</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <NeonCyanIcon type="check" size={16} className="text-current" />
                {editingSpotlight ? 'Update' : 'Create'} Spotlight
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSpotlight(null);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Spotlight List */}
      <div className="space-y-4">
        {spotlights.length === 0 ? (
          <div className="text-center py-8">
            <NeonCyanIcon type="star" size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No spotlights found. Create your first spotlight!</p>
          </div>
        ) : (
          spotlights.map((spotlight) => (
            <div
              key={spotlight.id}
              className={`bg-black/20 backdrop-blur-sm border rounded-xl p-4 transition-all ${
                spotlight.isActive 
                  ? 'border-yellow-400/50 bg-yellow-400/5' 
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{spotlight.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      spotlight.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {spotlight.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      Priority: {spotlight.priority}
                    </span>
                  </div>
                  <p className="text-white/70 mb-3">{spotlight.description}</p>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>Link: {spotlight.link}</span>
                    <span>Created: {spotlight.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(spotlight)}
                    className={`p-2 rounded-lg transition-colors ${
                      spotlight.isActive 
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                    title={spotlight.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <NeonCyanIcon type="star" size={16} className="text-current" />
                  </button>
                  <button
                    onClick={() => handleEdit(spotlight)}
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <NeonCyanIcon type="settings" size={16} className="text-current" />
                  </button>
                  <button
                    onClick={() => handleDelete(spotlight.id)}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
