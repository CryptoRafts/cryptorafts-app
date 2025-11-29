const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration - Load from environment variables for security
// NEVER hardcode API keys or credentials in code
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your_api_key_here",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your_project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your_sender_id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your_app_id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample spotlight data with serverTimestamp
const sampleSpotlight = {
  title: "DeFi Revolution Protocol",
  description: "A groundbreaking DeFi protocol that revolutionizes yield farming with AI-powered optimization. Our platform has already attracted $50M+ in TVL and partnerships with major exchanges.",
  imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop",
  link: "https://defirevolution.com",
  priority: 10,
  isActive: true,
  createdBy: "admin",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

async function addSampleSpotlight() {
  try {
    console.log('🚀 Adding sample spotlight to Firebase...');
    
    const docRef = await addDoc(collection(db, 'spotlights'), sampleSpotlight);
    console.log(`✅ Sample spotlight added with ID: ${docRef.id}`);
    console.log('🎉 Spotlight data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample spotlight:', error);
  }
}

// Run the function
addSampleSpotlight();
