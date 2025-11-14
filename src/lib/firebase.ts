// Firebase configuration
// Add these to your .env.local file:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Convert camelCase to UPPER_SNAKE_CASE for environment variable names
const camelToEnvVar = (camelCase: string): string => {
  return camelCase
    .replace(/([A-Z])/g, '_$1') // Insert underscore before capital letters
    .toUpperCase(); // Convert to uppercase
};

// Validate required Firebase configuration
const validateFirebaseConfig = () => {
  // Map of field names to their correct environment variable names
  const fieldToEnvVar: Record<string, string> = {
    apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  };

  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ] as const;

  const missingFields: string[] = [];

  requiredFields.forEach((field) => {
    if (!firebaseConfig[field]) {
      missingFields.push(fieldToEnvVar[field] || `NEXT_PUBLIC_FIREBASE_${camelToEnvVar(field)}`);
    }
  });

  if (missingFields.length > 0) {
    console.error(
      '❌ Firebase configuration is missing the following environment variables:',
      missingFields.join(', ')
    );
    console.error(
      'Please add them to your .env.local file. Example:',
      '\nNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com'
    );
    
    // In development, show a helpful error
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        `Firebase configuration error: Missing ${missingFields.join(', ')}. ` +
        `Please check your .env.local file.`
      );
    }
  }
};

// Validate configuration before initialization
validateFirebaseConfig();

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let storage: FirebaseStorage | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Only initialize storage if storageBucket is configured
  if (firebaseConfig.storageBucket) {
    storage = getStorage(app);
  } else {
    console.warn(
      '⚠️ Firebase Storage is not configured. storageBucket is missing. ' +
      'Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your .env.local file.'
    );
  }
} catch (error: any) {
  console.error('❌ Firebase initialization error:', error);
  if (error.code === 'storage/no-default-bucket') {
    console.error(
      '💡 Solution: Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your .env.local file. ' +
      'Format: your-project-id.appspot.com'
    );
  }
  // Don't throw in production to prevent app crash
  if (process.env.NODE_ENV === 'development') {
    throw error;
  }
}

export { app, storage };
