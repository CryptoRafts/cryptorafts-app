"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { vcTermSheetManager } from '@/lib/vc-term-sheet-manager';
import { VCTermSheetTemplate } from '@/lib/vc-data-models';
import { 
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface VCTermSheetBuilderProps {
  roomId: string;
  onClose: () => void;
}

export default function VCTermSheetBuilder({ roomId, onClose }: VCTermSheetBuilderProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<VCTermSheetTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<VCTermSheetTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [generatedContent, setGeneratedContent] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    if (!user) return;
    
    try {
      // Get orgId from user context
      const response = await fetch('/api/vc/get-org-id', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      const { orgId } = await response.json();
      
      const templatesData = await vcTermSheetManager.getTermSheetTemplates(orgId);
      setTemplates(templatesData);
      
      // Select default template if available
      const defaultTemplate = templatesData.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: VCTermSheetTemplate) => {
    setSelectedTemplate(template);
    setFormData({});
    setGeneratedContent('');
  };

  const handleFormChange = (variable: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const generatePreview = () => {
    if (!selectedTemplate) return;
    
    const content = vcTermSheetManager.generateTermSheetFromTemplate(selectedTemplate, formData);
    setGeneratedContent(content);
    setShowPreview(true);
  };

  const handleCreateTermSheet = async () => {
    if (!selectedTemplate || !user) return;
    
    try {
      await vcTermSheetManager.createTermSheetInRoom(roomId, selectedTemplate.id, formData, user.uid);
      onClose();
    } catch (error) {
      console.error('Error creating term sheet:', error);
      setError(error instanceof Error ? error.message : 'Failed to create term sheet');
    }
  };

  const renderTemplateSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Select Template</h3>
        <button
          onClick={() => setShowTemplateEditor(true)}
          className="flex items-center space-x-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>New Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">{template.name}</h4>
              {template.isDefault && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Default
                </span>
              )}
            </div>
            <p className="text-white/60 text-sm">{template.description}</p>
            <div className="mt-2 text-white/40 text-xs">
              {template.template.sections.length} sections
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8">
          <DocumentTextIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No templates available</p>
          <button
            onClick={() => setShowTemplateEditor(true)}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Create First Template
          </button>
        </div>
      )}
    </div>
  );

  const renderFormBuilder = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Term Sheet Details</h3>
          <div className="flex space-x-2">
            <button
              onClick={generatePreview}
              className="flex items-center space-x-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
            >
              <EyeIcon className="h-4 w-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={handleCreateTermSheet}
              className="flex items-center space-x-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Create</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(selectedTemplate.template.variables).map(([variable, config]) => (
            <div key={variable}>
              <label className="block text-sm font-medium text-white mb-2">
                {variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                {config.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              
              {config.type === 'select' ? (
                <select
                  value={formData[variable] || ''}
                  onChange={(e) => handleFormChange(variable, e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select {variable}</option>
                  {config.options?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : config.type === 'date' ? (
                <input
                  type="date"
                  value={formData[variable] || ''}
                  onChange={(e) => handleFormChange(variable, e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              ) : config.type === 'number' ? (
                <input
                  type="number"
                  value={formData[variable] || ''}
                  onChange={(e) => handleFormChange(variable, Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              ) : (
                <input
                  type="text"
                  value={formData[variable] || ''}
                  onChange={(e) => handleFormChange(variable, e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              )}
              
              {config.defaultValue && (
                <p className="text-white/40 text-xs mt-1">
                  Default: {config.defaultValue}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Preview</h3>
        <button
          onClick={() => setShowPreview(false)}
          className="flex items-center space-x-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
        >
          <XCircleIcon className="h-4 w-4" />
          <span>Close</span>
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="prose prose-invert max-w-none">
          <pre className="text-white/80 text-sm whitespace-pre-wrap font-sans">
            {generatedContent}
          </pre>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-[#05070B] to-[#0A1117] rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Term Sheet Builder</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!selectedTemplate && renderTemplateSelector()}
          {selectedTemplate && !showPreview && renderFormBuilder()}
          {showPreview && renderPreview()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="text-white/60 text-sm">
            {selectedTemplate ? `Using template: ${selectedTemplate.name}` : 'Select a template to begin'}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            {selectedTemplate && (
              <button
                onClick={handleCreateTermSheet}
                disabled={!formData || Object.keys(formData).length === 0}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors"
              >
                Create Term Sheet
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
