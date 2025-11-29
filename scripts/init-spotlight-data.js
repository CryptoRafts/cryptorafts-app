const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample spotlight data
const sampleSpotlights = [
  {
    title: "DeFi Revolution Protocol",
    description: "A groundbreaking DeFi protocol that revolutionizes yield farming with AI-powered optimization. Our platform has already attracted $50M+ in TVL and partnerships with major exchanges.",
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop",
    link: "https://defirevolution.com",
    priority: 10,
    isActive: true,
    createdBy: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "NFT Marketplace 3.0",
    description: "The next generation of NFT marketplaces with cross-chain compatibility, AI curation, and sustainable minting. Join 100K+ creators already using our platform.",
    imageUrl: "https://images.unsplash.com/photo-1642790105077-9a5b4d9b9c0d?w=800&h=600&fit=crop",
    link: "https://nftmarketplace3.com",
    priority: 9,
    isActive: true,
    createdBy: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Web3 Gaming Ecosystem",
    description: "Immersive blockchain gaming with play-to-earn mechanics, NFT integration, and cross-platform compatibility. Over 1M+ active players and growing.",
    imageUrl: "https://images.unsplash.com/photo-1556438064-2d7646166914?w=800&h=600&fit=crop",
    link: "https://web3gaming.io",
    priority: 8,
    isActive: true,
    createdBy: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Sustainable Blockchain Infrastructure",
    description: "Eco-friendly blockchain solutions with 99% reduced energy consumption. Partnering with major corporations for carbon-neutral blockchain adoption.",
    imageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=600&fit=crop",
    link: "https://sustainableblockchain.org",
    priority: 7,
    isActive: false,
    createdBy: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function initializeSpotlightData() {
  try {
    console.log('🚀 Initializing spotlight data...');
    
    // Add sample spotlights
    for (const spotlight of sampleSpotlights) {
      try {
        const docRef = await addDoc(collection(db, 'spotlights'), spotlight);
        console.log(`✅ Added spotlight: ${spotlight.title} (ID: ${docRef.id})`);
      } catch (error) {
        console.error(`❌ Error adding spotlight ${spotlight.title}:`, error);
      }
    }
    
    console.log('🎉 Spotlight data initialization completed!');
    console.log('📊 Summary:');
    console.log(`   - Total spotlights: ${sampleSpotlights.length}`);
    console.log(`   - Active spotlights: ${sampleSpotlights.filter(s => s.isActive).length}`);
    console.log(`   - Inactive spotlights: ${sampleSpotlights.filter(s => !s.isActive).length}`);
    
  } catch (error) {
    console.error('❌ Error initializing spotlight data:', error);
  }
}

// Run the initialization
initializeSpotlightData();
