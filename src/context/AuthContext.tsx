import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  authError: string | null;
  loginWithCredentials: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'thinklog_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync user profile to Firestore if Firebase auth is active
  const syncFirebaseUserToFirestore = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);
      const profileData = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Pengguna Google',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || '',
        role: 'Verified Google User',
        updatedAt: new Date().toISOString(),
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, profileData);
      }
    } catch (err) {
      console.warn('Sync to Firestore skipped or restricted by security rules:', err);
    }
  };

  useEffect(() => {
    // 1. First check if there is an active Firebase Auth session
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const appUser: AppUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
          role: 'Google Account',
          authMethod: 'google',
        };
        setUser(appUser);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Google takes priority
        await syncFirebaseUserToFirestore(fbUser);
        setLoading(false);
      } else {
        // 2. If no Firebase user, check if we have a persistent credentials session
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.uid) {
              setUser(parsed);
            }
          } catch {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithCredentials = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const cleanUsername = username.trim().toLowerCase();
    
    // Strict credential check as requested by user
    if (cleanUsername === 'ananabila' && pass === 'pakailogikamu86') {
      const credUser: AppUser = {
        uid: 'user_ananabila',
        username: 'ananabila',
        displayName: 'Ana Nabila',
        email: 'ana.farimatun.2302316@students.um.ac.id',
        role: 'Pro Creator & Thinker',
        authMethod: 'credentials',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      };
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(credUser));
      setUser(credUser);
      return { success: true };
    }

    const err = 'Username atau password salah. Gunakan username "ananabila" dan password "pakailogikamu86".';
    setAuthError(err);
    return { success: false, error: err };
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const appUser: AppUser = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Google User',
        email: fbUser.email || undefined,
        photoURL: fbUser.photoURL || undefined,
        role: 'Google Account',
        authMethod: 'google',
      };
      setUser(appUser);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      await syncFirebaseUserToFirestore(fbUser);
    } catch (error: any) {
      console.error('Google Sign-in Error:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setAuthError('Jendela masuk Google ditutup sebelum selesai.');
      } else if (error?.code === 'auth/cancelled-popup-request') {
        setAuthError('Permintaan masuk Google dibatalkan.');
      } else {
        setAuthError(error?.message || 'Gagal masuk dengan Google.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setUser(null);
      setAuthError(null);
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        loginWithCredentials,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
