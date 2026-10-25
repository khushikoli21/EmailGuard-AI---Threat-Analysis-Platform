import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
const app = !getApps().length ? initializeApp(firebaseConfigData) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with Workspace & Profile scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token cache (never in localStorage per security instructions)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface GoogleAuthResult {
  user: FirebaseUser;
  accessToken: string | null;
}

/**
 * Initialize auth listener on application load
 */
export const initFirebaseAuth = (
  onSuccess?: (user: FirebaseUser, token: string | null) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onFailure) onFailure();
    }
  });
};

export const isUserCancelledAuth = (error: any): boolean => {
  if (!error) return false;
  const code = error.code || '';
  const msg = error.message || '';
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    msg.includes('popup-closed-by-user') ||
    msg.includes('cancelled-popup-request')
  );
};

export const isPopupBlockedAuth = (error: any): boolean => {
  if (!error) return false;
  const code = error.code || '';
  const msg = error.message || '';
  return code === 'auth/popup-blocked' || msg.includes('popup-blocked');
};

/**
 * Sign in using Google with Firebase Auth popup
 */
export const signInWithGooglePopup = async (): Promise<GoogleAuthResult | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;

    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    if (isUserCancelledAuth(error)) {
      // User closed the popup window or cancelled prompt - clean intentional dismiss
      return null;
    }
    if (isPopupBlockedAuth(error)) {
      console.warn('[FIREBASE_AUTH] Sign-in popup blocked by browser policies.');
      throw error;
    }
    console.error('[FIREBASE_AUTH] Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve the current in-memory cached access token
 */
export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Update cached token
 */
export const setCachedAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

/**
 * Firebase Sign Out
 */
export const firebaseSignOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
  }
};
