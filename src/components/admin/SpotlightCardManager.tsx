"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db } from '@/lib/firebase.client';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  PaintBrushIcon,
  ArrowLeftIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';
import VisualSpotlightEditor from './VisualSpotlightEditor';

interface SpotlightCardLayout {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  layout: {
    logoSize: 'small' | 'medium' | 'large';
    logoPosition: 'left' | 'center' | 'right';
    textAlignment: 'left' | 'center' | 'right';
    badgeStyle: 'rounded' | 'square' | 'pill';
    buttonStyle: 'gradient' | 'solid' | 'outline';
    socialPosition: 'right' | 'bottom' | 'hidden';
    spacing: 'compact' | 'normal' | 'spacious';
  };
  customStyles: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Memoized layout card component
const LayoutCard = memo(({ layout, onEdit, onDelete, onSetActive }: {
  layout: SpotlightCardLayout;
  onEdit: (layout: SpotlightCardLayout) => void;
  onDelete: (id: string) => void;
  onSetActive: (id: string) => void;
}) => (
  <div className="neo-glass-card rounded-xl p-4 hover:shadow-xl transition-all">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="text-white font-bold text-base">{layout.name}</h3>
        <p className="text-white/60 text-xs">{layout.description}</p>
      </div>
      {layout.isActive && (
        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
          Active
        </span>
      )}
    </div>

    <div className="mb-3 p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg">
      <div className="text-white/40 text-xs text-center">Preview</div>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => onEdit(layout)}
        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-sm"
      >
        <PencilIcon className="w-3 h-3" />
        Edit
      </button>
      {!layout.isActive && (
        <button
          onClick={() => onSetActive(layout.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-sm"
        >
          <CheckIcon className="w-3 h-3" />
          Activate
        </button>
      )}
      <button
        onClick={() => onDelete(layout.id)}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all"
      >
        <TrashIcon className="w-3 h-3" />
      </button>
    </div>
  </div>
));

LayoutCard.displayName = 'LayoutCard';

export default function SpotlightCardManager() {
  const { user, claims } = useAuth();
  const [layouts, setLayouts] = useState<SpotlightCardLayout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<SpotlightCardLayout | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);

  const hasAccess = useMemo(() => 
    claims?.role === 'admin' || 
    (claims?.department === 'spotlight' && 
     (claims?.departmentRole === 'admin' || claims?.departmentRole === 'staff')),
    [claims]
  );

  const loadLayouts = useCallback(async () => {
    if (!db) {
      console.error('Database not available');
      return;
    }
    
    try {
      setLoading(true);
      const layoutsRef = collection(db!, 'spotlightCardLayouts');
      const snapshot = await getDocs(layoutsRef);
      const layoutsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as SpotlightCardLayout[];
      setLayouts(layoutsData);
    } catch (error) {
      console.error('Error loading layouts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadLayouts();
    }
  }, [hasAccess, loadLayouts]);

  const handleCreateLayout = useCallback(() => {
    const newLayout: SpotlightCardLayout = {
      id: '',
      name: 'New Layout',
      description: 'Custom spotlight layout',
      isActive: false,
      layout: {
        logoSize: 'medium',
        logoPosition: 'left',
        textAlignment: 'left',
        badgeStyle: 'rounded',
        buttonStyle: 'gradient',
        socialPosition: 'right',
        spacing: 'normal'
      },
      customStyles: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#ec4899',
        backgroundColor: '#1f2937',
        textColor: '#ffffff'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSelectedLayout(newLayout);
    setIsEditing(true);
  }, []);

  const handleEditLayout = useCallback((layout: SpotlightCardLayout) => {
    setSelectedLayout(layout);
    setIsEditing(true);
  }, []);

  const handleSaveLayout = useCallback(async () => {
    if (!selectedLayout || !db) return;

    try {
      setSaving(true);
      const layoutData = {
        ...selectedLayout,
        updatedAt: new Date()
      };

      if (selectedLayout.id) {
        await updateDoc(doc(db!, 'spotlightCardLayouts', selectedLayout.id), layoutData);
      } else {
        const newLayoutRef = doc(collection(db!, 'spotlightCardLayouts'));
        await setDoc(newLayoutRef, { ...layoutData, id: newLayoutRef.id, createdAt: new Date() });
      }

      await loadLayouts();
      setIsEditing(false);
      setSelectedLayout(null);
    } catch (error) {
      console.error('Error saving layout:', error);
    } finally {
      setSaving(false);
    }
  }, [selectedLayout, loadLayouts]);

  const handleDeleteLayout = useCallback(async (layoutId: string) => {
    if (!confirm('Delete this layout?') || !db) return;

    try {
      await deleteDoc(doc(db!, 'spotlightCardLayouts', layoutId));
      await loadLayouts();
    } catch (error) {
      console.error('Error deleting layout:', error);
    }
  }, [loadLayouts]);

  const handleSetActive = useCallback(async (layoutId: string) => {
    if (!db) return;
    const dbInstance = db; // Capture for type narrowing
    try {
      const updatePromises = layouts.map(layout =>
        updateDoc(doc(dbInstance, 'spotlightCardLayouts', layout.id), { isActive: false })
      );
      await Promise.all(updatePromises);
      await updateDoc(doc(dbInstance, 'spotlightCardLayouts', layoutId), { isActive: true });
      await loadLayouts();
    } catch (error) {
      console.error('Error setting active layout:', error);
    }
  }, [layouts, loadLayouts]);

  if (!hasAccess) {
    return (
      <div className="neo-glass-card rounded-xl p-6 text-center">
        <h3 className="text-white text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-white/70">You don't have permission to manage spotlight layouts.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading layouts..." />;
  }

  if (showVisualEditor) {
    return (
      <div>
        <button
          onClick={() => setShowVisualEditor(false)}
          className="mb-4 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Layout Manager
        </button>
        <VisualSpotlightEditor />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Optimized Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <BoltIcon className="w-6 h-6 text-yellow-400" />
            Layout Manager
          </h2>
          <p className="text-white/60 text-sm">Fast and responsive layout management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVisualEditor(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <PaintBrushIcon className="w-4 h-4" />
            Visual Editor
          </button>
          <button
            onClick={handleCreateLayout}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            New Layout
          </button>
        </div>
      </div>

      {/* Optimized Layouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {layouts.map((layout) => (
          <LayoutCard
            key={layout.id}
            layout={layout}
            onEdit={handleEditLayout}
            onDelete={handleDeleteLayout}
            onSetActive={handleSetActive}
          />
        ))}

        {layouts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <h3 className="text-white text-lg font-semibold mb-2">No Layouts Yet</h3>
            <p className="text-white/60 mb-4">Create your first layout</p>
            <button
              onClick={handleCreateLayout}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Create Layout
            </button>
          </div>
        )}
      </div>

      {/* Fast Edit Modal */}
      {isEditing && selectedLayout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Layout</h3>
              <button onClick={() => setIsEditing(false)} className="text-white/70 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedLayout.name}
                    onChange={(e) => setSelectedLayout({ ...selectedLayout, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={selectedLayout.description}
                    onChange={(e) => setSelectedLayout({ ...selectedLayout, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              {/* Layout Settings */}
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Layout</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-white text-xs mb-1">Logo Size</label>
                    <select
                      value={selectedLayout.layout.logoSize}
                      onChange={(e) => setSelectedLayout({
                        ...selectedLayout,
                        layout: { ...selectedLayout.layout, logoSize: e.target.value as any }
                      })}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white text-xs mb-1">Logo Position</label>
                    <select
                      value={selectedLayout.layout.logoPosition}
                      onChange={(e) => setSelectedLayout({
                        ...selectedLayout,
                        layout: { ...selectedLayout.layout, logoPosition: e.target.value as any }
                      })}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white text-xs mb-1">Text Align</label>
                    <select
                      value={selectedLayout.layout.textAlignment}
                      onChange={(e) => setSelectedLayout({
                        ...selectedLayout,
                        layout: { ...selectedLayout.layout, textAlignment: e.target.value as any }
                      })}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(selectedLayout.customStyles).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-white text-xs mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setSelectedLayout({
                          ...selectedLayout,
                          customStyles: { ...selectedLayout.customStyles, [key]: e.target.value }
                        })}
                        className="w-full h-8 rounded border border-white/20"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLayout}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
