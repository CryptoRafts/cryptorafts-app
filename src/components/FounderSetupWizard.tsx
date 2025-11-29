"use client";

import React, { useState } from 'react';
import { 
  UserIcon,
  CheckCircleIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface FounderSetupWizardProps {
  onComplete?: (data: any) => void;
}

const FounderSetupWizard: React.FC<FounderSetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(2);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    projectName: '',
    projectDescription: '',
    website: '',
    twitter: '',
    linkedin: ''
  });

  const steps = [
    { id: 1, name: 'Role Selected', completed: true },
    { id: 2, name: 'Profile Setup', active: true },
    { id: 3, name: 'KYC Verification', pending: true }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
  };

  const handleSubmit = () => {
    onComplete?.(formData);
  };

  return (
    <div className="min-h-screen neo-blue-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Founder Registration</h1>
          <p className="text-white/60">Complete your founder profile to get started</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-500' 
                      : step.active 
                      ? 'bg-blue-500' 
                      : 'bg-white/10 border-2 border-white/20'
                  }`}>
                    {step.completed ? (
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    ) : (
                      <span className={`text-sm font-semibold ${
                        step.active ? 'text-white' : 'text-white/60'
                      }`}>
                        {step.id}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium mt-2 ${
                    step.active ? 'text-white' : 'text-white/60'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-white/20" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Profile/Company Picture</h2>
            <p className="text-white/60">Upload a clear photo (PNG/JPG, max 5MB) - Optional</p>
          </div>

          {/* Profile Image Upload */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              {profileImage ? (
                <div className="relative">
                  <Image
                    src={profileImage}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="w-30 h-30 rounded-full object-cover border-4 border-white/20"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-30 h-30 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center">
                  <PhotoIcon className="w-12 h-12 text-white/40" />
                </div>
              )}
            </div>

            <button
              onClick={() => document.getElementById('image-upload')?.click()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25"
            >
              Change Photo
            </button>

            <input
              id="image-upload"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your first name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="SG">Singapore</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Project Name</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Project Description</label>
              <textarea
                value={formData.projectDescription}
                onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your project"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Twitter</label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="@username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleSubmit}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 text-lg font-semibold"
            >
              Complete Profile Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FounderSetupWizard;
