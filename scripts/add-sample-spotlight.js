const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14",
  authDomain: "cryptorafts-b9067.firebaseapp.com",
  projectId: "cryptorafts-b9067",
  storageBucket: "cryptorafts-b9067.firebasestorage.app",
  messagingSenderId: "374711838796",
  appId: "1:374711838796:web:3bee725bfa7d8790456ce9"
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
