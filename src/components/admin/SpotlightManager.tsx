"use client";

import React, { useState, useEffect } from 'react';
import { db, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from '@/lib/firebase.client';
import { SparklesIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { logSpotlightChange } from '@/lib/admin/audit';

export interface SpotlightItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  link?: string;
  badge?: string;
  priority: number;
  published: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

interface SpotlightManagerProps {
  userId: string;
  userEmail: string;
}

export default function SpotlightManager({ userId, userEmail }: SpotlightManagerProps) {
  const [items, setItems] = useState<SpotlightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<SpotlightItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  useEffect(() => {
    loadItems();
  }, []);
  
  const loadItems = async () => {
    if (!db) return;
    
    try {
      const q = query(collection(db!, 'spotlightItems'), orderBy('priority', 'desc'));
      const snapshot = await getDocs(q);
      const loadedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpotlightItem));
      setItems(loadedItems);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load spotlight items:', error);
      setIsLoading(false);
    }
  };
  
  const saveItem = async (item: Partial<SpotlightItem>) => {
    if (!db) return;
    
    try {
      const itemId = item.id || `spotlight-${Date.now()}`;
      const itemData: SpotlightItem = {
        id: itemId,
        title: item.title || '',
        description: item.description || '',
        imageUrl: item.imageUrl,
        link: item.link,
        badge: item.badge,
        priority: item.priority || 0,
        published: item.published || false,
        scheduledStart: item.scheduledStart,
        scheduledEnd: item.scheduledEnd,
        createdAt: item.createdAt || new Date().toISOString(),
        createdBy: item.createdBy || userId,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db!, 'spotlightItems', itemId), itemData);
      
      // Log to audit
      await logSpotlightChange(
        userId,
        userEmail,
        item.id ? 'spotlight.update' : 'spotlight.create',
        itemId,
        itemData
      );
      
      await loadItems();
      setShowForm(false);
      setEditingItem(null);
      alert('✅ Spotlight item saved!');
    } catch (error) {
      console.error('Failed to save spotlight item:', error);
      alert('❌ Failed to save item');
    }
  };
  
  const deleteItem = async (itemId: string) => {
    if (!db || !confirm('Delete this spotlight item?')) return;
    
    try {
      await deleteDoc(doc(db!, 'spotlightItems', itemId));
      await logSpotlightChange(userId, userEmail, 'spotlight.delete', itemId);
      await loadItems();
      alert('✅ Item deleted');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('❌ Failed to delete item');
    }
  };
  
  const togglePublish = async (item: SpotlightItem) => {
    if (!db) return;
    
    try {
      const newPublished = !item.published;
      await setDoc(doc(db!, 'spotlightItems', item.id), {
        ...item,
        published: newPublished,
        updatedAt: new Date().toISOString()
      });
      
      await logSpotlightChange(
        userId,
        userEmail,
        newPublished ? 'spotlight.publish' : 'spotlight.unpublish',
        item.id
      );
      
      await loadItems();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-bold flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-purple-400" />
          Spotlight Console
        </h2>
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Item
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-white/60">Loading...</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-white font-semibold">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.published ? 'bg-green-600 text-white' : 'bg-gray-600 text-white/70'
                  }`}>
                    {item.published ? 'Published' : 'Draft'}
                  </span>
                  {item.badge && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                      {item.badge}
                    </span>
                  )}
                  <span className="text-white/40 text-xs">Priority: {item.priority}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePublish(item)}
                  className="p-2 text-white/70 hover:text-white"
                  title={item.published ? 'Unpublish' : 'Publish'}
                >
                  {item.published ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => { setEditingItem(item); setShowForm(true); }}
                  className="p-2 text-white/70 hover:text-white"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-red-400 hover:text-red-300"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-white text-xl font-bold mb-4">
              {editingItem ? 'Edit' : 'Create'} Spotlight Item
            </h3>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                saveItem({
                  id: editingItem?.id,
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  imageUrl: formData.get('imageUrl') as string,
                  link: formData.get('link') as string,
                  badge: formData.get('badge') as string,
                  priority: parseInt(formData.get('priority') as string),
                  published: formData.get('published') === 'on',
                  createdAt: editingItem?.createdAt,
                  createdBy: editingItem?.createdBy
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-white text-sm block mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingItem?.title}
                  required
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
              </div>
              
              <div>
                <label className="text-white text-sm block mb-1">Description *</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description}
                  required
                  rows={3}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
              </div>
              
              <div>
                <label className="text-white text-sm block mb-1">Image URL</label>
                <input
                  type="text"
                  name="imageUrl"
                  defaultValue={editingItem?.imageUrl}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
              </div>
              
              <div>
                <label className="text-white text-sm block mb-1">Link</label>
                <input
                  type="text"
                  name="link"
                  defaultValue={editingItem?.link}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-white text-sm block mb-1">Badge</label>
                  <input
                    type="text"
                    name="badge"
                    defaultValue={editingItem?.badge}
                    placeholder="e.g. NEW, HOT"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="text-white text-sm block mb-1">Priority</label>
                  <input
                    type="number"
                    name="priority"
                    defaultValue={editingItem?.priority || 0}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="published"
                  id="published"
                  defaultChecked={editingItem?.published}
                  className="w-4 h-4"
                />
                <label htmlFor="published" className="text-white text-sm">Publish immediately</label>
              </div>
              
              <div className="flex items-center gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingItem(null); }}
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

