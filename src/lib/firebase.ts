import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const COLLECTIONS = {
  INFLUENCERS: 'influencers',
  CLAIMS: 'claims',
  SEARCH_CONFIG: 'search_config',
  API_KEYS: 'api_keys',
} as const;

export interface FirestoreInfluencer {
  id: string;
  name: string;
  handle: string;
  followers: number;
  category: string;
  stats: {
    verified: number;
    debunked: number;
  };
  lastUpdated: string;
  createdAt: string;
}

export interface FirestoreClaim {
  id: string;
  influencerId: string;
  statement: string;
  category: string;
  analysis: {
    result: 'verified' | 'debunked';
    explanation: string;
    confidence: number;
    sources: Array<{
      title: string;
      url: string;
    }>;
  };
  createdAt: string;
}
