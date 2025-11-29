"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase.client';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function AddSampleDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [completed, setCompleted] = useState<string[]>([]);

  const addSampleData = async () => {
    setIsLoading(true);
    setProgress('Starting to add sample data...');
    setCompleted([]);

    try {
      // Sample Users
      setProgress('Adding sample users...');
      const sampleUsers = [
        {
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'founder',
          kycStatus: 'pending',
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          isActive: true,
          phone: '+1234567890',
          country: 'USA',
          company: 'TechCorp Solutions'
        },
        {
          email: 'jane.smith@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'investor',
          kycStatus: 'approved',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
          lastLoginAt: Timestamp.now(),
          isActive: true,
          phone: '+1234567891',
          country: 'Canada',
          company: 'Investor Group LLC'
        },
        {
          email: 'mike.wilson@example.com',
          firstName: 'Mike',
          lastName: 'Wilson',
          role: 'founder',
          kycStatus: 'rejected',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 172800000)),
          lastLoginAt: Timestamp.fromDate(new Date(Date.now() - 3600000)),
          isActive: true,
          phone: '+1234567892',
          country: 'UK',
          company: 'Wilson Ventures'
        },
        {
          email: 'sarah.johnson@example.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'investor',
          kycStatus: 'pending',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 259200000)),
          lastLoginAt: Timestamp.now(),
          isActive: true,
          phone: '+1234567893',
          country: 'Australia',
          company: 'Johnson Capital'
        },
        {
          email: 'alex.chen@example.com',
          firstName: 'Alex',
          lastName: 'Chen',
          role: 'founder',
          kycStatus: 'approved',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 345600000)),
          lastLoginAt: Timestamp.now(),
          isActive: true,
          phone: '+1234567894',
          country: 'Singapore',
          company: 'Chen Technologies'
        }
      ];

      for (const userData of sampleUsers) {
        if (db) {
          await addDoc(collection(db!, 'users'), userData);
        }
      }
      setCompleted(prev => [...prev, 'Users']);

      // Sample KYC Documents
      setProgress('Adding sample KYC documents...');
      const sampleKYCDocuments = [
        {
          userId: 'user1',
          userEmail: 'john.doe@example.com',
          userName: 'John Doe',
          status: 'pending',
          submittedAt: Timestamp.now(),
          documents: {
            idFront: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            idBack: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            selfie: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
            proofOfAddress: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
          },
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-15',
            nationality: 'American',
            address: '123 Main St, New York, NY 10001',
            phone: '+1234567890'
          },
          verificationLevel: 'basic'
        },
        {
          userId: 'user2',
          userEmail: 'jane.smith@example.com',
          userName: 'Jane Smith',
          status: 'approved',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
          reviewedAt: Timestamp.now(),
          reviewedBy: 'admin@cryptorafts.com',
          documents: {
            idFront: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            idBack: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            selfie: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300',
            proofOfAddress: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
          },
          personalInfo: {
            firstName: 'Jane',
            lastName: 'Smith',
            dateOfBirth: '1985-05-20',
            nationality: 'Canadian',
            address: '456 Oak Ave, Toronto, ON M5V 3A8',
            phone: '+1234567891'
          },
          verificationLevel: 'enhanced'
        },
        {
          userId: 'user3',
          userEmail: 'mike.wilson@example.com',
          userName: 'Mike Wilson',
          status: 'rejected',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 172800000)),
          reviewedAt: Timestamp.now(),
          reviewedBy: 'admin@cryptorafts.com',
          rejectionReason: 'Document quality insufficient',
          documents: {
            idFront: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            idBack: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            selfie: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
            proofOfAddress: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
          },
          personalInfo: {
            firstName: 'Mike',
            lastName: 'Wilson',
            dateOfBirth: '1988-03-10',
            nationality: 'British',
            address: '789 High St, London, UK SW1A 1AA',
            phone: '+1234567892'
          },
          verificationLevel: 'basic'
        },
        {
          userId: 'user4',
          userEmail: 'sarah.johnson@example.com',
          userName: 'Sarah Johnson',
          status: 'pending',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 259200000)),
          documents: {
            idFront: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            idBack: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            selfie: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
            proofOfAddress: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
          },
          personalInfo: {
            firstName: 'Sarah',
            lastName: 'Johnson',
            dateOfBirth: '1992-07-25',
            nationality: 'Australian',
            address: '321 Collins St, Melbourne, VIC 3000',
            phone: '+1234567893'
          },
          verificationLevel: 'basic'
        },
        {
          userId: 'user5',
          userEmail: 'alex.chen@example.com',
          userName: 'Alex Chen',
          status: 'approved',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 345600000)),
          reviewedAt: Timestamp.now(),
          reviewedBy: 'admin@cryptorafts.com',
          documents: {
            idFront: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            idBack: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            selfie: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
            proofOfAddress: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
          },
          personalInfo: {
            firstName: 'Alex',
            lastName: 'Chen',
            dateOfBirth: '1987-11-12',
            nationality: 'Singaporean',
            address: '654 Orchard Rd, Singapore 238863',
            phone: '+1234567894'
          },
          verificationLevel: 'enhanced'
        }
      ];

      for (const kycData of sampleKYCDocuments) {
        if (db) {
          await addDoc(collection(db!, 'kyc_documents'), kycData);
        }
      }
      setCompleted(prev => [...prev, 'KYC Documents']);

      // Sample KYB Documents
      setProgress('Adding sample KYB documents...');
      const sampleKYBDocuments = [
        {
          organizationName: 'TechCorp Solutions',
          organizationType: 'Corporation',
          registrationNumber: 'TC123456789',
          taxId: 'TAX987654321',
          address: '789 Business Blvd, San Francisco, CA 94105',
          country: 'USA',
          contactPerson: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          website: 'https://techcorp.com',
          businessDescription: 'Technology solutions provider specializing in blockchain and cryptocurrency services',
          kybStatus: 'pending',
          submittedAt: Timestamp.now().toDate().toISOString(),
          contactPersonTitle: 'CEO',
          industry: 'Technology',
          employees: '50-100',
          revenue: '1M-10M'
        },
        {
          organizationName: 'Investor Group LLC',
          organizationType: 'LLC',
          registrationNumber: 'IG987654321',
          taxId: 'TAX123456789',
          address: '321 Investment St, New York, NY 10001',
          country: 'USA',
          contactPerson: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567891',
          website: 'https://investorgroup.com',
          businessDescription: 'Investment firm focused on early-stage technology startups',
          kybStatus: 'approved',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 86400000)).toDate().toISOString(),
          reviewedAt: Timestamp.now().toDate().toISOString(),
          reviewedBy: 'admin@cryptorafts.com',
          contactPersonTitle: 'Managing Partner',
          industry: 'Finance',
          employees: '10-50',
          revenue: '10M-50M'
        },
        {
          organizationName: 'Wilson Ventures',
          organizationType: 'Partnership',
          registrationNumber: 'WV456789123',
          taxId: 'TAX456789123',
          address: '555 Venture Ave, London, UK EC1A 4HD',
          country: 'UK',
          contactPerson: 'Mike Wilson',
          email: 'mike.wilson@example.com',
          phone: '+1234567892',
          website: 'https://wilsonventures.com',
          businessDescription: 'Venture capital firm investing in fintech and blockchain startups',
          kybStatus: 'rejected',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 172800000)).toDate().toISOString(),
          reviewedAt: Timestamp.now().toDate().toISOString(),
          reviewedBy: 'admin@cryptorafts.com',
          rejectionReason: 'Incomplete documentation',
          contactPersonTitle: 'Managing Director',
          industry: 'Finance',
          employees: '5-10',
          revenue: '5M-10M'
        },
        {
          organizationName: 'Johnson Capital',
          organizationType: 'Corporation',
          registrationNumber: 'JC789123456',
          taxId: 'TAX789123456',
          address: '888 Capital St, Sydney, NSW 2000',
          country: 'Australia',
          contactPerson: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          phone: '+1234567893',
          website: 'https://johnsoncapital.com',
          businessDescription: 'Private equity firm specializing in technology investments',
          kybStatus: 'pending',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 259200000)).toDate().toISOString(),
          contactPersonTitle: 'Investment Director',
          industry: 'Finance',
          employees: '20-50',
          revenue: '50M-100M'
        },
        {
          organizationName: 'Chen Technologies',
          organizationType: 'Corporation',
          registrationNumber: 'CT321654987',
          taxId: 'TAX321654987',
          address: '999 Tech Park, Singapore 138588',
          country: 'Singapore',
          contactPerson: 'Alex Chen',
          email: 'alex.chen@example.com',
          phone: '+1234567894',
          website: 'https://chentechnologies.com',
          businessDescription: 'Technology company developing blockchain solutions and cryptocurrency platforms',
          kybStatus: 'approved',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 345600000)).toDate().toISOString(),
          reviewedAt: Timestamp.now().toDate().toISOString(),
          reviewedBy: 'admin@cryptorafts.com',
          contactPersonTitle: 'CTO',
          industry: 'Technology',
          employees: '100-200',
          revenue: '10M-50M'
        }
      ];

      for (const kybData of sampleKYBDocuments) {
        if (db) {
          await addDoc(collection(db!, 'organizations'), kybData);
        }
      }
      setCompleted(prev => [...prev, 'KYB Documents']);

      // Sample Projects
      setProgress('Adding sample projects...');
      const sampleProjects = [
        {
          name: 'CryptoWallet Pro',
          description: 'A revolutionary cryptocurrency wallet with advanced security features including biometric authentication, hardware security modules, and multi-signature support.',
          founderId: 'founder1',
          founderName: 'John Doe',
          founderEmail: 'john.doe@example.com',
          status: 'pending',
          category: 'FinTech',
          fundingGoal: 500000,
          currentFunding: 125000,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          tags: ['crypto', 'wallet', 'security'],
          pitch: 'Revolutionary crypto wallet with biometric security'
        },
        {
          name: 'AI Trading Bot',
          description: 'Intelligent trading bot using machine learning algorithms to provide intelligent investment recommendations and automated trading strategies.',
          founderId: 'founder2',
          founderName: 'Jane Smith',
          founderEmail: 'jane.smith@example.com',
          status: 'approved',
          category: 'AI/ML',
          fundingGoal: 750000,
          currentFunding: 300000,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
          updatedAt: Timestamp.now(),
          tags: ['ai', 'trading', 'crypto', 'ml'],
          pitch: 'AI-powered trading bot for crypto markets'
        },
        {
          name: 'Blockchain Analytics Platform',
          description: 'Advanced analytics platform for blockchain transactions and cryptocurrency market analysis.',
          founderId: 'founder3',
          founderName: 'Mike Wilson',
          founderEmail: 'mike.wilson@example.com',
          status: 'rejected',
          category: 'Analytics',
          fundingGoal: 300000,
          currentFunding: 0,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 172800000)),
          updatedAt: Timestamp.now(),
          tags: ['blockchain', 'analytics', 'crypto'],
          pitch: 'Comprehensive blockchain analytics solution'
        },
        {
          name: 'DeFi Yield Farming',
          description: 'Decentralized finance platform for yield farming and liquidity provision.',
          founderId: 'founder4',
          founderName: 'Sarah Johnson',
          founderEmail: 'sarah.johnson@example.com',
          status: 'pending',
          category: 'DeFi',
          fundingGoal: 1000000,
          currentFunding: 250000,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 259200000)),
          updatedAt: Timestamp.now(),
          tags: ['defi', 'yield', 'farming', 'liquidity'],
          pitch: 'Next-generation DeFi yield farming platform'
        },
        {
          name: 'NFT Marketplace',
          description: 'Decentralized NFT marketplace with advanced features for creators and collectors.',
          founderId: 'founder5',
          founderName: 'Alex Chen',
          founderEmail: 'alex.chen@example.com',
          status: 'approved',
          category: 'NFT',
          fundingGoal: 800000,
          currentFunding: 400000,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 345600000)),
          updatedAt: Timestamp.now(),
          tags: ['nft', 'marketplace', 'creators', 'collectors'],
          pitch: 'Revolutionary NFT marketplace platform'
        }
      ];

      for (const projectData of sampleProjects) {
        if (db) {
          await addDoc(collection(db!, 'projects'), projectData);
        }
      }
      setCompleted(prev => [...prev, 'Projects']);

      // Sample Spotlights
      setProgress('Adding sample spotlights...');
      const sampleSpotlights = [
        {
          title: 'Featured: CryptoWallet Pro',
          description: 'Revolutionary cryptocurrency wallet with advanced security features',
          projectId: 'project1',
          projectName: 'CryptoWallet Pro',
          founderId: 'founder1',
          founderName: 'John Doe',
          founderEmail: 'john.doe@example.com',
          status: 'active',
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          category: 'FinTech',
          priority: 1,
          featuredImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500'
        },
        {
          title: 'Spotlight: AI Trading Bot',
          description: 'Intelligent trading bot using machine learning',
          projectId: 'project2',
          projectName: 'AI Trading Bot',
          founderId: 'founder2',
          founderName: 'Jane Smith',
          founderEmail: 'jane.smith@example.com',
          status: 'pending',
          isActive: false,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
          updatedAt: Timestamp.now(),
          category: 'AI/ML',
          priority: 2,
          featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500'
        },
        {
          title: 'Featured: NFT Marketplace',
          description: 'Decentralized NFT marketplace for creators',
          projectId: 'project5',
          projectName: 'NFT Marketplace',
          founderId: 'founder5',
          founderName: 'Alex Chen',
          founderEmail: 'alex.chen@example.com',
          status: 'active',
          isActive: true,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 345600000)),
          updatedAt: Timestamp.now(),
          category: 'NFT',
          priority: 3,
          featuredImage: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=500'
        }
      ];

      for (const spotlightData of sampleSpotlights) {
        if (db) {
          await addDoc(collection(db!, 'spotlights'), spotlightData);
        }
      }
      setCompleted(prev => [...prev, 'Spotlights']);

      // Sample Pitches
      setProgress('Adding sample pitches...');
      const samplePitches = [
        {
          title: 'Revolutionary Crypto Wallet',
          company: 'TechCorp Solutions',
          fundingAmount: '$500,000',
          description: 'We are developing a next-generation cryptocurrency wallet with advanced security features including biometric authentication, hardware security modules, and multi-signature support.',
          status: 'pending',
          createdAt: Timestamp.now(),
          founderName: 'John Doe',
          founderEmail: 'john.doe@example.com',
          businessModel: 'SaaS',
          marketSize: '$50B',
          traction: '10,000+ users',
          teamSize: '15',
          stage: 'Series A'
        },
        {
          title: 'AI-Powered Trading Platform',
          company: 'Investor Group LLC',
          fundingAmount: '$750,000',
          description: 'Our AI-powered trading platform uses machine learning algorithms to provide intelligent investment recommendations and automated trading strategies.',
          status: 'approved',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
          reviewedAt: Timestamp.now(),
          reviewedBy: 'admin@cryptorafts.com',
          founderName: 'Jane Smith',
          founderEmail: 'jane.smith@example.com',
          businessModel: 'Subscription',
          marketSize: '$100B',
          traction: '50,000+ users',
          teamSize: '25',
          stage: 'Series B'
        },
        {
          title: 'DeFi Yield Farming Platform',
          company: 'Johnson Capital',
          fundingAmount: '$1,000,000',
          description: 'Next-generation DeFi platform for yield farming and liquidity provision with advanced risk management.',
          status: 'pending',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 259200000)),
          founderName: 'Sarah Johnson',
          founderEmail: 'sarah.johnson@example.com',
          businessModel: 'Transaction Fees',
          marketSize: '$200B',
          traction: '25,000+ users',
          teamSize: '20',
          stage: 'Series A'
        }
      ];

      for (const pitchData of samplePitches) {
        if (db) {
          await addDoc(collection(db!, 'pitches'), pitchData);
        }
      }
      setCompleted(prev => [...prev, 'Pitches']);

      setProgress('Sample data added successfully!');
      console.log('✅ All sample data added successfully!');

    } catch (error) {
      console.error('❌ Error adding sample data:', error);
      setProgress('Error adding sample data: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-8 text-center">
          <PlusIcon className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Add Sample Data</h1>
          <p className="text-gray-300 mb-6">
            This will add comprehensive sample data to all Firestore collections for testing admin functionality.
          </p>
          
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-green-400 font-semibold mb-2">Data to be added:</h3>
            <div className="text-sm text-green-300 space-y-1">
              <div>• 5 Sample Users (with different KYC statuses)</div>
              <div>• 5 KYC Documents (pending, approved, rejected)</div>
              <div>• 5 KYB Organizations (pending, approved, rejected)</div>
              <div>• 5 Projects (different statuses and categories)</div>
              <div>• 3 Spotlights (active and pending)</div>
              <div>• 3 Pitch Submissions (different stages)</div>
            </div>
          </div>

          {isLoading && (
            <div className="mb-6">
              <LoadingSpinner size="sm" />
              <p className="text-gray-300 mt-2">{progress}</p>
              {completed.length > 0 && (
                <div className="mt-4">
                  <p className="text-green-400 text-sm font-semibold mb-2">Completed:</p>
                  <div className="flex flex-wrap gap-2">
                    {completed.map((item, index) => (
                      <span key={index} className="px-2 py-1 bg-green-600 text-white text-xs rounded-full flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={addSampleData}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Adding Sample Data...
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5" />
                Add Sample Data
              </>
            )}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-2">After adding data, visit:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <div><a href="/admin/users" className="text-blue-400 hover:underline">/admin/users</a></div>
              <div><a href="/admin/kyc" className="text-blue-400 hover:underline">/admin/kyc</a></div>
              <div><a href="/admin/kyb" className="text-blue-400 hover:underline">/admin/kyb</a></div>
              <div><a href="/admin/projects" className="text-blue-400 hover:underline">/admin/projects</a></div>
              <div><a href="/admin/spotlights" className="text-blue-400 hover:underline">/admin/spotlights</a></div>
              <div><a href="/admin/pitch" className="text-blue-400 hover:underline">/admin/pitch</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
