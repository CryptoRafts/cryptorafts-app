"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { 
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface KYBData {
  kyb_reg_number: string;
  kyb_jurisdiction: string;
  kyb_docs: string[];
}

export default function FounderKYBForm() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<KYBData>({
    kyb_reg_number: '',
    kyb_jurisdiction: '',
    kyb_docs: []
  });

  const handleInputChange = (field: keyof KYBData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      if (!file.type.includes('pdf')) {
        setError(`File ${file.name} must be a PDF document.`);
        return;
      }
    }

    // Add new documents
    const newDocuments = [...documents, ...files];
    const newUrls = [...documentUrls, ...files.map(file => URL.createObjectURL(file))];
    
    setDocuments(newDocuments);
    setDocumentUrls(newUrls);
    setError('');
  };

  const removeDocument = (index: number) => {
    const newDocuments = documents.filter((_, i) => i !== index);
    const newUrls = documentUrls.filter((_, i) => i !== index);
    
    setDocuments(newDocuments);
    setDocumentUrls(newUrls);
  };

  const handleSkip = async () => {
    if (!user || !db) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Update user document to skip KYB
      await updateDoc(doc(db!, 'users', user.uid), {
        kyb_status: 'SKIPPED',
        kyb_skipped_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Redirect to dashboard
      router.push('/founder/dashboard');
    } catch (err: any) {
      setError(err?.message || "Failed to skip KYB");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !db) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Upload documents to storage (simulate)
      const docUrls = documents.map((doc, index) => 
        `uploads/kyb/${user.uid}/doc_${index}.pdf`
      );

      // Create KYB record
      const kybData = {
        ...formData,
        kyb_docs: docUrls,
        status: 'SUBMITTED',
        submitted_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      // Store KYB data in subcollection
      await setDoc(doc(db!, 'users', user.uid, 'kyb', 'verification'), kybData);

      // Update user document
      await updateDoc(doc(db!, 'users', user.uid), {
        kyb_status: 'SUBMITTED',
        updated_at: serverTimestamp()
      });

      // Redirect to dashboard
      router.push('/founder/dashboard');
    } catch (err: any) {
      setError(err?.message || "KYB submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
            <BuildingOfficeIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Business Verification (KYB)
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Optional: Verify your business entity to unlock additional features
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          
          {/* Skip Option */}
          <div className="text-center mb-8">
            <p className="text-gray-300 mb-4">
              KYB verification is optional for founders. You can skip this step and complete it later.
            </p>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Skip KYB for Now
            </button>
          </div>

          <div className="border-t border-white/10 pt-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Business Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Business Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">Company Registration Number</label>
                    <input
                      type="text"
                      value={formData.kyb_reg_number}
                      onChange={(e) => handleInputChange('kyb_reg_number', e.target.value)}
                      className="form-input"
                      placeholder="Enter your company registration number"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Jurisdiction</label>
                    <select
                      value={formData.kyb_jurisdiction}
                      onChange={(e) => handleInputChange('kyb_jurisdiction', e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select Jurisdiction</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="SG">Singapore</option>
                      <option value="JP">Japan</option>
                      <option value="KR">South Korea</option>
                      <option value="IN">India</option>
                      <option value="BR">Brazil</option>
                      <option value="MX">Mexico</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Business Documents</h2>
                
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Registered Entity Documents</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Upload your business registration documents (PDF format, max 10MB each)
                  </p>
                  
                  {documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="h-8 w-8 text-blue-400" />
                            <div>
                              <p className="text-white font-medium">{doc.name}</p>
                              <p className="text-sm text-gray-400">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-48 h-32 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mx-auto hover:border-blue-400/50 transition-colors duration-300">
                        <div className="text-center">
                          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Upload documents</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <DocumentTextIcon className="w-5 h-5" />
                        <span>Upload Documents</span>
                      </span>
                    </button>
                    <p className="text-sm text-gray-400 mt-2">
                      PDF files only, maximum 10MB each
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                >
                  {isSubmitting ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting KYB...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Submit KYB</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
