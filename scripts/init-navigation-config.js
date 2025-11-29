// Initialize Firestore navigation configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global navigation config
const globalConfig = {
  logo: "/cryptorafts_logo.png",
  items: [
    {"label":"Home","href":"/","visible":true,"order":1},
    {"label":"Project Overview","href":"/projects","visible":true,"order":2},
    {"label":"Pitch Your Project","href":"/register","visible":true,"order":3,"cta":true},
    {"label":"Support","href":"/support","visible":true,"order":4},
    {"label":"Contact Us","href":"/contact","visible":true,"order":5}
  ]
};

// Role-specific configs
const roleConfigs = {
  founder: {
    primary: {"label":"Founder Home","href":"/founder"},
    submenu: [
      {"label":"My Projects","href":"/founder/projects"},
      {"label":"Messages","href":"/founder/messages"},
      {"label":"AI Insights","href":"/founder/insights"}
    ]
  },
  vc: {
    primary: {"label":"Dealflow","href":"/vc"},
    submenu: [
      {"label":"Pipeline","href":"/vc/pipeline"},
      {"label":"Watchlist","href":"/vc/watchlist"},
      {"label":"Messages","href":"/vc/messages"}
    ]
  },
  exchange: {
    primary: {"label":"Listings","href":"/exchange"},
    submenu: [
      {"label":"Candidates","href":"/exchange/candidates"},
      {"label":"Listing Pipeline","href":"/exchange/pipeline"},
      {"label":"Messages","href":"/exchange/messages"}
    ]
  },
  ido: {
    primary: {"label":"Launchpad","href":"/ido"},
    submenu: [
      {"label":"Intake","href":"/ido/intake"},
      {"label":"Sales","href":"/ido/sales"},
      {"label":"Messages","href":"/ido/messages"}
    ]
  },
  influencer: {
    primary: {"label":"Campaigns","href":"/influencer"},
    submenu: [
      {"label":"Offers","href":"/influencer/offers"},
      {"label":"Tracking","href":"/influencer/tracking"},
      {"label":"Payouts","href":"/influencer/payouts"},
      {"label":"Messages","href":"/influencer/messages"}
    ]
  },
  agency: {
    primary: {"label":"Campaign Manager","href":"/agency"},
    submenu: [
      {"label":"Opportunities","href":"/agency/opportunities"},
      {"label":"Assets","href":"/agency/assets"},
      {"label":"Messages","href":"/agency/messages"}
    ]
  }
};

async function initNavigationConfig() {
  try {
    console.log('Initializing navigation configuration...');
    
    // Set global config
    await setDoc(doc(db, 'navConfig', 'global'), globalConfig);
    console.log('✅ Global navigation config set');
    
    // Set role configs
    for (const [role, config] of Object.entries(roleConfigs)) {
      await setDoc(doc(db, 'navConfig', 'roles', role), config);
      console.log(`✅ ${role} navigation config set`);
    }
    
    console.log('🎉 Navigation configuration initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing navigation config:', error);
  }
}

initNavigationConfig();
