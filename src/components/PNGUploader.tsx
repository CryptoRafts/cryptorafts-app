"use client";

import { useState, useRef } from "react";

interface PNGUploaderProps {
  onFileSelect: (file: File | null) => void;
  onError?: (error: string) => void;
  placeholder: string;
  required?: boolean;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  className?: string;
}

export default function PNGUploader({ 
  onFileSelect, 
  onError, 
  placeholder, 
  required = false,
  aspectRatio = 'square',
  className = ''
}: PNGUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validatePNG = (file: File): boolean => {
    // Check file type
    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      onError?.('Only PNG files are allowed');
      return false;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onError?.('File size must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validatePNG(file)) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      onFileSelect(file);
      onError?.(''); // Clear any previous errors
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'portrait':
        return 'aspect-[3/4]';
      case 'landscape':
        return 'aspect-[4/3]';
      default:
        return 'aspect-square';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging 
            ? 'border-blue-400 bg-blue-500/10' 
            : selectedFile 
              ? 'border-green-400 bg-green-500/10' 
              : 'border-white/20 hover:border-white/40'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,image/png"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-4">
            <div className={`mx-auto ${getAspectRatioClass()} max-w-xs`}>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <p className="text-green-400 font-medium">✓ {selectedFile?.name}</p>
              <p className="text-xs text-white/60">
                {(selectedFile?.size || 0) / (1024 * 1024)} MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-red-400 hover:text-red-300 text-sm underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">{placeholder}</p>
              <p className="text-white/60 text-sm mt-1">
                PNG format only • Max 5MB
              </p>
              {required && (
                <p className="text-blue-400 text-xs mt-1">Required</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
