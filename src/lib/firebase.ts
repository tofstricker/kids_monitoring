import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must use the firestoreDatabaseId from the config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
  };
}

export function handleFirestoreError(error: any, operation: string, path: string | null = null): never {
  console.error(`Firestore Error [${operation}] at ${path}:`, error);
  
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error.message || 'Unknown Firestore error',
    operationType: operation as any,
    path,
    authInfo: {
      userId: user?.uid || 'unauthenticated',
      email: user?.email || 'none',
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous || false,
    }
  };

  throw new Error(JSON.stringify(errorInfo));
}

export async function testFirebaseConnection() {
  try {
    // Phase 0: Test connection with a server-side fetch
    await getDocFromServer(doc(db, '_internal_', 'probe'));
    return true;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      // This is actually "good" because it means we reached the server 
      // but were blocked by our default-deny rules.
      return true;
    }
    console.error("Firebase connection check failed:", error);
    return false;
  }
}
