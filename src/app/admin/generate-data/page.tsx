"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateDataPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSampleData = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🔄 Generating sample data...');
      
      // Dynamic imports to avoid chunk loading errors
      const { ensureDb, waitForFirebase } = await import('@/lib/firebase-utils');
      const { collection, addDoc, Timestamp } = await import('firebase/firestore');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        setIsGenerating(false);
        return;
      }

      const db = ensureDb();
      if (!db) {
        console.error('❌ Firebase database not initialized');
        setIsGenerating(false);
        return;
      }

      // Generate KYC Documents
      const kycDocuments = [
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
            nationality: 'US',
            address: '123 Main St, New York, NY 10001'
          },
          riskScore: 25,
          createdAt: Timestamp.now()
        },
        {
          userId: 'user2',
          userEmail: 'jane.smith@example.com',
          userName: 'Jane Smith',
          status: 'approved',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2)),
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
            nationality: 'CA',
            address: '456 Oak Ave, Toronto, ON M5V 3A8'
          },
          riskScore: 15,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2))
        },
        {
          userId: 'user3',
          userEmail: 'mike.wilson@example.com',
          userName: 'Mike Wilson',
          status: 'rejected',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 5)),
          reviewedAt: Timestamp.now(),
          reviewedBy: 'admin@cryptorafts.com',
          rejectionReason: 'Invalid document provided',
          documents: {
            idFront: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            idBack: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
            selfie: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
            proofOfAddress: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
          },
          personalInfo: {
            firstName: 'Mike',
            lastName: 'Wilson',
            dateOfBirth: '1992-08-10',
            nationality: 'UK',
            address: '789 Pine St, London, UK SW1A 1AA'
          },
          riskScore: 85,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 5))
        }
      ];

      // Add KYC documents
      for (const docData of kycDocuments) {
        await addDoc(collection(db, 'kyc_documents'), docData);
      }

      // Generate KYB Documents
      const kybDocuments = [
        {
          organizationName: 'TechCorp Solutions',
          organizationType: 'Corporation',
          registrationNumber: 'TC123456789',
          taxId: 'TAX987654321',
          address: '123 Tech Lane, Silicon Valley, CA',
          country: 'USA',
          contactPerson: 'Alice Smith',
          email: 'alice.smith@techcorp.com',
          phone: '+1-555-123-4567',
          website: 'https://www.techcorp.com',
          businessDescription: 'Leading software development company specializing in AI solutions.',
          documents: {
            registrationCertificate: 'https://example.com/techcorp_reg.pdf',
            taxCertificate: 'https://example.com/techcorp_tax.pdf',
            businessLicense: 'https://example.com/techcorp_license.pdf',
          },
          kybStatus: 'pending',
          submittedAt: Timestamp.now().toDate().toISOString(),
          createdAt: Timestamp.now()
        },
        {
          organizationName: 'Global Innovations Ltd.',
          organizationType: 'Limited Company',
          registrationNumber: 'GI987654321',
          taxId: 'TAX123456789',
          address: '456 Innovation Drive, London, UK',
          country: 'UK',
          contactPerson: 'Bob Johnson',
          email: 'bob.j@globalinnovations.co.uk',
          phone: '+44-20-7123-4567',
          website: 'https://www.globalinnovations.co.uk',
          businessDescription: 'Pioneering research and development in sustainable energy solutions.',
          documents: {
            registrationCertificate: 'https://example.com/global_reg.pdf',
            taxCertificate: 'https://example.com/global_tax.pdf',
            bankStatement: 'https://example.com/global_bank.pdf',
          },
          kybStatus: 'approved',
          submittedAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 5)).toDate().toISOString(),
          reviewedAt: Timestamp.now().toDate().toISOString(),
          reviewedBy: 'admin@cryptorafts.com',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 5))
        }
      ];

      // Add KYB documents
      for (const docData of kybDocuments) {
        await addDoc(collection(db, 'organizations'), docData);
      }

      // Generate Projects
      const projects = [
        {
          name: 'DeFi Protocol Alpha',
          description: 'Revolutionary decentralized finance protocol for automated market making.',
          founderId: 'user1',
          founderName: 'John Doe',
          founderEmail: 'john.doe@example.com',
          status: 'pending',
          category: 'DeFi',
          fundingGoal: 5000000,
          currentFunding: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          name: 'NFT Marketplace Pro',
          description: 'Professional NFT marketplace with advanced trading features.',
          founderId: 'user2',
          founderName: 'Jane Smith',
          founderEmail: 'jane.smith@example.com',
          status: 'approved',
          category: 'NFT',
          fundingGoal: 2000000,
          currentFunding: 500000,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 3)),
          updatedAt: Timestamp.now()
        }
      ];

      // Add Projects
      for (const docData of projects) {
        await addDoc(collection(db, 'projects'), docData);
      }

      console.log('✅ Sample data generated successfully!');
      alert('Sample data generated successfully! You can now see real data in the admin pages.');
      
    } catch (error) {
      console.error('❌ Error generating sample data:', error);
      alert('Error generating sample data. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl max-w-md w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Generate Sample Data</h1>
          <p className="text-gray-300 mb-6">
            This will add sample KYC, KYB, and Project data to make the admin pages show real information.
          </p>
          
          <button
            onClick={generateSampleData}
            disabled={isGenerating}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Sample Data'}
          </button>
          
          <button
            onClick={() => router.push('/admin-dashboard')}
            className="w-full mt-4 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
