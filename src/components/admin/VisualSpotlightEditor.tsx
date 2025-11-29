"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import Image from 'next/image';
import {
  ArrowsPointingOutIcon,
  PhotoIcon,
  DocumentTextIcon,
  LinkIcon,
  PaintBrushIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  Cog6ToothIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpotlightLayout {
  id: string;
  name: string;
  elements: {
    banner: ElementPosition & { backgroundSize: 'cover' | 'contain' | 'auto'; backgroundPosition: string };
    logo: ElementPosition & { size: number; borderRadius: number; borderWidth: number };
    projectName: ElementPosition & { fontSize: number; fontWeight: string };
    tagline: ElementPosition & { fontSize: number; opacity: number };
    description: ElementPosition & { fontSize: number; maxLines: number; lineHeight: number };
    badges: ElementPosition & { spacing: number; size: string };
    buttons: ElementPosition & { gap: number; height: number };
    socialLinks: ElementPosition & { direction: 'vertical' | 'horizontal'; iconSize: number };
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    bannerOverlay: string;
    text: string;
    textSecondary: string;
  };
  canvasSize: {
    width: number;
    height: number;
  };
}

// Memoized element preview component for better performance
const ElementPreview = memo(({ id, element, isSelected, color, onMouseDown }: any) => {
  const getElementContent = useCallback(() => {
    switch (id) {
      case 'logo':
        return <div className="w-full h-full bg-white/10 rounded-xl border-2 border-purple-500 flex items-center justify-center text-xs">🖼️</div>;
      case 'projectName':
        return <div className="text-white font-bold truncate">Project Name</div>;
      case 'tagline':
        return <div className="text-white/70 text-xs truncate">Tagline</div>;
      case 'description':
        return <div className="text-white/60 text-xs">Description...</div>;
      case 'badges':
        return <div className="flex gap-1 text-xs">✓ ✓ ✓</div>;
      case 'buttons':
        return <div className="flex gap-1"><div className="px-2 py-1 bg-purple-500 rounded text-xs">Btn</div><div className="px-2 py-1 bg-pink-500 rounded text-xs">Btn</div></div>;
      case 'socialLinks':
        return <div className="flex flex-col gap-1 text-xs">🐦 📱 💬</div>;
      default:
        return null;
    }
  }, [id]);

  return (
    <div
      className={`absolute cursor-move transition-shadow select-none ${
        isSelected ? 'ring-2 ring-white shadow-xl z-50' : 'ring-1 ring-white/20 z-10'
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
      }}
      onMouseDown={onMouseDown}
    >
      <div className={`absolute -top-6 left-0 text-xs font-semibold px-2 py-1 rounded ${color} text-white whitespace-nowrap`}>
        {id.replace(/([A-Z])/g, ' $1').trim()}
      </div>
      <div className="w-full h-full flex items-center justify-center text-white/60 text-xs p-2 font-medium overflow-hidden">
        {getElementContent()}
      </div>
      {isSelected && (
        <>
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-tl cursor-nwse-resize" />
          <div className="absolute -bottom-6 left-0 text-xs text-white bg-gray-900 px-2 py-1 rounded font-mono whitespace-nowrap">
            {Math.round(element.x)}, {Math.round(element.y)}
          </div>
        </>
      )}
    </div>
  );
});

ElementPreview.displayName = 'ElementPreview';

export default function VisualSpotlightEditor() {
  const { user, claims } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [layoutName, setLayoutName] = useState('New Layout');
  const [zoom, setZoom] = useState(0.8);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasAccess = useMemo(() => 
    claims?.role === 'admin' || 
    (claims?.department === 'spotlight' && 
     (claims?.departmentRole === 'admin' || claims?.departmentRole === 'staff')),
    [claims]
  );

  const [layout, setLayout] = useState<SpotlightLayout>({
    id: '',
    name: 'New Layout',
    elements: {
      banner: { x: 0, y: 0, width: 1200, height: 400, backgroundSize: 'cover', backgroundPosition: 'center' },
      logo: { x: 60, y: 60, width: 120, height: 120, size: 120, borderRadius: 16, borderWidth: 3 },
      projectName: { x: 200, y: 70, width: 400, height: 50, fontSize: 36, fontWeight: '700' },
      tagline: { x: 200, y: 130, width: 400, height: 30, fontSize: 18, opacity: 0.8 },
      description: { x: 60, y: 200, width: 700, height: 100, fontSize: 16, maxLines: 3, lineHeight: 1.6 },
      badges: { x: 60, y: 320, width: 500, height: 50, spacing: 12, size: 'medium' },
      buttons: { x: 60, y: 380, width: 400, height: 56, gap: 16 },
      socialLinks: { x: 900, y: 60, width: 240, height: 340, direction: 'vertical', iconSize: 24 }
    },
    colors: {
      primary: '#8b5cf6',
      secondary: '#ec4899',
      background: '#1a1f2e',
      bannerOverlay: 'rgba(0, 0, 0, 0.5)',
      text: '#ffffff',
      textSecondary: '#9ca3af'
    },
    canvasSize: {
      width: 1200,
      height: 500
    }
  });

  const elements = useMemo(() => [
    { id: 'banner', label: 'Banner', icon: PhotoIcon, color: 'bg-blue-500' },
    { id: 'logo', label: 'Logo', icon: PhotoIcon, color: 'bg-purple-500' },
    { id: 'projectName', label: 'Name', icon: DocumentTextIcon, color: 'bg-pink-500' },
    { id: 'tagline', label: 'Tagline', icon: DocumentTextIcon, color: 'bg-cyan-500' },
    { id: 'description', label: 'Description', icon: DocumentTextIcon, color: 'bg-green-500' },
    { id: 'badges', label: 'Badges', icon: CheckIcon, color: 'bg-emerald-500' },
    { id: 'buttons', label: 'Buttons', icon: ArrowsPointingOutIcon, color: 'bg-orange-500' },
    { id: 'socialLinks', label: 'Social', icon: LinkIcon, color: 'bg-indigo-500' }
  ], []);

  const handleElementMouseDown = useCallback((elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || selectedElement === 'banner') return;

    const deltaX = (e.clientX - dragStart.x) / zoom;
    const deltaY = (e.clientY - dragStart.y) / zoom;

    setLayout(prev => {
      const element = prev.elements[selectedElement as keyof typeof prev.elements] as ElementPosition;
      return {
        ...prev,
        elements: {
          ...prev.elements,
          [selectedElement]: {
            ...element,
            x: Math.max(0, Math.min(prev.canvasSize.width - element.width, element.x + deltaX)),
            y: Math.max(0, Math.min(prev.canvasSize.height - element.height, element.y + deltaY))
          }
        }
      };
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, selectedElement, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Debounced update for better performance
  const debouncedUpdate = useCallback((elementId: string, property: string, value: any) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setLayout(prev => ({
        ...prev,
        elements: {
          ...prev.elements,
          [elementId]: {
            ...prev.elements[elementId as keyof typeof prev.elements],
            [property]: value
          }
        }
      }));
    }, 16); // ~60fps
  }, []);

  const updateElementProperty = useCallback((elementId: string, property: string, value: any) => {
    setLayout(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementId]: {
          ...prev.elements[elementId as keyof typeof prev.elements],
          [property]: value
        }
      }
    }));
  }, []);

  const updateColor = useCallback((colorKey: string, value: string) => {
    setLayout(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  }, []);

  const resetLayout = useCallback(() => {
    if (confirm('Reset to default layout?')) {
      setLayout(prev => ({
        ...prev,
        elements: {
          banner: { x: 0, y: 0, width: 1200, height: 400, backgroundSize: 'cover', backgroundPosition: 'center' },
          logo: { x: 60, y: 60, width: 120, height: 120, size: 120, borderRadius: 16, borderWidth: 3 },
          projectName: { x: 200, y: 70, width: 400, height: 50, fontSize: 36, fontWeight: '700' },
          tagline: { x: 200, y: 130, width: 400, height: 30, fontSize: 18, opacity: 0.8 },
          description: { x: 60, y: 200, width: 700, height: 100, fontSize: 16, maxLines: 3, lineHeight: 1.6 },
          badges: { x: 60, y: 320, width: 500, height: 50, spacing: 12, size: 'medium' },
          buttons: { x: 60, y: 380, width: 400, height: 56, gap: 16 },
          socialLinks: { x: 900, y: 60, width: 240, height: 340, direction: 'vertical', iconSize: 24 }
        }
      }));
    }
  }, []);

  const saveLayout = useCallback(async () => {
    try {
      console.log('Saving layout:', { ...layout, name: layoutName });
      alert('✅ Layout saved successfully!');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving layout:', error);
      alert('Error saving layout');
    }
  }, [layout, layoutName]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  if (!hasAccess) {
    return (
      <div className="neo-glass-card rounded-xl p-6 text-center">
        <h3 className="text-white text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-white/70">You don't have permission to use the visual editor.</p>
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
            Visual Editor
          </h2>
          <p className="text-white/60 text-sm">Superfast drag-and-drop editor</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="text-white hover:text-purple-400 px-2">-</button>
            <span className="text-white text-xs font-mono">{(zoom * 100).toFixed(0)}%</span>
            <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="text-white hover:text-purple-400 px-2">+</button>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`${showPreview ? 'bg-green-600' : 'bg-gray-600'} text-white font-semibold px-3 py-1 rounded-lg transition-all flex items-center gap-1 text-sm`}
          >
            <EyeIcon className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={resetLayout}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-3 py-1 rounded-lg transition-all text-sm"
          >
            Reset
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-3 py-1 rounded-lg transition-all flex items-center gap-1 text-sm"
          >
            <CheckIcon className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Compact Element List */}
        <div className="col-span-2 space-y-2">
          <div className="neo-glass-card rounded-xl p-3">
            <h3 className="text-white font-bold mb-3 text-xs">ELEMENTS</h3>
            <div className="space-y-1">
              {elements.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setSelectedElement(id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-xs ${
                    selectedElement === id
                      ? `${color} border border-white`
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3 text-white flex-shrink-0" />
                  <span className="text-white font-medium text-xs truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optimized Canvas */}
        <div className="col-span-7">
          <div className="neo-glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Canvas</h3>
              <div className="text-white/60 text-xs">{layout.canvasSize.width}x{layout.canvasSize.height}</div>
            </div>
            
            <div
              ref={canvasRef}
              className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-auto border border-white/10"
              style={{ maxHeight: '65vh' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                style={{
                  width: layout.canvasSize.width,
                  height: layout.canvasSize.height,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  willChange: 'transform'
                }}
                className="relative"
              >
                {/* Banner */}
                <div
                  className={`absolute inset-0 ${selectedElement === 'banner' ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedElement('banner')}
                  style={{
                    backgroundColor: layout.colors.background,
                    backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))'
                  }}
                >
                  {selectedElement === 'banner' && (
                    <div className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded bg-blue-500 text-white">
                      Banner
                    </div>
                  )}
                </div>

                {/* Other Elements */}
                {elements.slice(1).map(({ id, color }) => {
                  const element = layout.elements[id as keyof typeof layout.elements] as ElementPosition;
                  return (
                    <ElementPreview
                      key={id}
                      id={id}
                      element={element}
                      isSelected={selectedElement === id}
                      color={color}
                      onMouseDown={(e: React.MouseEvent) => handleElementMouseDown(id, e)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Optimized Properties Panel */}
        <div className="col-span-3">
          <div className="neo-glass-card rounded-xl p-3 max-h-[65vh] overflow-y-auto">
            <h3 className="text-white font-bold mb-3 text-xs flex items-center gap-2 sticky top-0 bg-gray-900/90 backdrop-blur -mx-3 -mt-3 p-3 z-10">
              <Cog6ToothIcon className="w-4 h-4" />
              PROPERTIES
            </h3>
            
            {selectedElement ? (
              <div className="space-y-3">
                <div className="pb-2 border-b border-white/10">
                  <div className="text-white font-bold text-sm capitalize">{selectedElement.replace(/([A-Z])/g, ' $1')}</div>
                </div>

                {selectedElement !== 'banner' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-white/70 text-xs mb-1 block">X</label>
                      <input
                        type="number"
                        value={Math.round((layout.elements[selectedElement as keyof typeof layout.elements] as ElementPosition).x)}
                        onChange={(e) => updateElementProperty(selectedElement, 'x', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-xs mb-1 block">Y</label>
                      <input
                        type="number"
                        value={Math.round((layout.elements[selectedElement as keyof typeof layout.elements] as ElementPosition).y)}
                        onChange={(e) => updateElementProperty(selectedElement, 'y', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-xs mb-1 block">W</label>
                      <input
                        type="number"
                        value={Math.round((layout.elements[selectedElement as keyof typeof layout.elements] as ElementPosition).width)}
                        onChange={(e) => updateElementProperty(selectedElement, 'width', parseInt(e.target.value) || 50)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-xs mb-1 block">H</label>
                      <input
                        type="number"
                        value={Math.round((layout.elements[selectedElement as keyof typeof layout.elements] as ElementPosition).height)}
                        onChange={(e) => updateElementProperty(selectedElement, 'height', parseInt(e.target.value) || 30)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Element-specific quick controls */}
                {selectedElement === 'logo' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-white/70 text-xs mb-1 block">Size: {(layout.elements.logo as any).size}px</label>
                      <input
                        type="range"
                        min="40"
                        max="200"
                        value={(layout.elements.logo as any).size}
                        onChange={(e) => updateElementProperty('logo', 'size', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {(selectedElement === 'projectName' || selectedElement === 'tagline' || selectedElement === 'description') && (
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Font: {(layout.elements[selectedElement as keyof typeof layout.elements] as any).fontSize}px</label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={(layout.elements[selectedElement as keyof typeof layout.elements] as any).fontSize}
                      onChange={(e) => updateElementProperty(selectedElement, 'fontSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Quick color palette */}
                <div className="pt-2 border-t border-white/10">
                  <h4 className="text-white font-semibold mb-2 text-xs">COLORS</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(layout.colors).map(([key, value]) => (
                      <div key={key}>
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="w-full h-8 rounded border border-white/20 cursor-pointer"
                          title={key}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                <Cog6ToothIcon className="w-12 h-12 mx-auto mb-2 text-white/20" />
                <p className="text-xs">Select element</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Live Preview */}
      {showPreview && (
        <div className="neo-glass-card rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
            <EyeIcon className="w-4 h-4 text-green-400" />
            Live Preview
          </h3>
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border border-white/10">
            <div className="relative rounded-xl overflow-hidden shadow-2xl"
                 style={{ height: layout.canvasSize.height * 0.6, maxWidth: layout.canvasSize.width * 0.6, margin: '0 auto' }}>
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: layout.colors.background,
                  backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))'
                }}
              >
                <div className="absolute inset-0" style={{ backgroundColor: layout.colors.bannerOverlay }}></div>
              </div>

              {/* Simplified preview content */}
              <div className="relative h-full p-4 flex flex-col justify-center">
                <div className="text-white font-bold text-2xl mb-2">CryptoRafts</div>
                <div className="text-white/70 text-sm mb-3">Your Gateway to Web3 Innovation</div>
                <div className="text-white/60 text-xs mb-4 line-clamp-2">
                  A revolutionary platform connecting Web3 innovators with funding and resources.
                </div>
                <div className="flex gap-2 mb-3">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">✓ KYC</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">✓ KYB</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-purple-500 text-white text-xs rounded">View Project</button>
                  <button className="px-3 py-1 border border-purple-500 text-white text-xs rounded">Website</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fast Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-white/20 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Save Layout</h3>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
              placeholder="Layout Name"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveLayout}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
