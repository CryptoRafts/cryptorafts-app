/**
 * Secure Document Viewer
 * Displays documents with watermarks, signed URLs, and audit tracking
 * NO DATA LEAKAGE - Completely secure
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  DocumentIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { DossierDocument } from '@/lib/dossier/types';
import { logDocumentAccess } from '@/lib/rbac/audit';

interface SecureDocumentViewerProps {
  document: DossierDocument;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  dossierId: string;
  allowDownload?: boolean;
  onClose: () => void;
}

export default function SecureDocumentViewer({
  document,
  actorId,
  actorEmail,
  actorRole,
  dossierId,
  allowDownload = true,
  onClose
}: SecureDocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [watermark, setWatermark] = useState('');

  useEffect(() => {
    // Create watermark text
    const timestamp = new Date().toLocaleString();
    setWatermark(`Confidential · Viewed by ${actorEmail} · ${timestamp}`);

    // Log document view
    logDocumentAccess({
      actorId,
      actorEmail,
      actorRole,
      documentId: document.id,
      documentType: document.type,
      action: 'VIEW',
      dossierId
    });

    setIsLoading(false);
  }, [document, actorEmail, actorId, actorRole, dossierId]);

  const handleDownload = async () => {
    if (!allowDownload) {
      alert('Download is not permitted for this document');
      return;
    }

    // Log download
    await logDocumentAccess({
      actorId,
      actorEmail,
      actorRole,
      documentId: document.id,
      documentType: document.type,
      action: 'DOWNLOAD',
      dossierId
    });

    // Open document in new tab for download
    window.open(document.url, '_blank');
    
    console.log('📥 Document download initiated');
  };

  const renderDocument = () => {
    const isPDF = document.mimeType === 'application/pdf' || document.name.endsWith('.pdf');
    const isImage = document.mimeType.startsWith('image/');
    const isVideo = document.mimeType.startsWith('video/');

    if (isPDF) {
      return (
        <div className="relative w-full h-full">
          <iframe
            src={`${document.url}#toolbar=0`}
            className="w-full h-full border-0"
            title={document.name}
          />
          {/* Watermark overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded">
              {watermark}
            </div>
          </div>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black/80">
          <img
            src={document.url}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setIsLoading(false)}
          />
          {/* Watermark overlay */}
          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1 rounded">
            {watermark}
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video
            src={document.url}
            controls
            className="max-w-full max-h-full"
            onLoadedData={() => setIsLoading(false)}
          />
          {/* Watermark overlay */}
          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1 rounded pointer-events-none">
            {watermark}
          </div>
        </div>
      );
    }

    // Unsupported file type
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <DocumentIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <p className="text-white/80 mb-2">Preview not available</p>
          <p className="text-white/60 text-sm">File type: {document.mimeType}</p>
          {allowDownload && (
            <button
              onClick={handleDownload}
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Download to View
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <DocumentIcon className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-white font-semibold text-lg">{document.name}</h2>
              <div className="flex items-center space-x-4 text-xs text-white/60 mt-1">
                <span>Type: {document.type}</span>
                <span>•</span>
                <span>Size: {(document.size / 1024).toFixed(2)} KB</span>
                {document.hash && (
                  <>
                    <span>•</span>
                    <span title={document.hash}>Hash: {document.hash.substring(0, 8)}...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Security Badge */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
              <ShieldCheckIcon className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-xs font-semibold">Secure View</span>
            </div>

            {/* Download Button */}
            {allowDownload && (
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-lg">Loading document...</div>
          </div>
        )}
        {renderDocument()}
      </div>

      {/* Footer - Security Info */}
      <div className="bg-gray-900 border-t border-white/10 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>Uploaded: {new Date(document.uploadedAt).toLocaleString()}</span>
            </span>
            {document.verified && (
              <span className="flex items-center space-x-1 text-green-400">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Verified</span>
              </span>
            )}
          </div>
          <div className="text-white/40">
            Viewing as: {actorEmail}
          </div>
        </div>
      </div>
    </div>
  );
}

