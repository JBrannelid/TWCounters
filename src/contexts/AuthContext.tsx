import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { storage } from '@/services/storage';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          setIsAdmin(userData?.isAdmin || false);
          setIsMasterAdmin(userData?.isMasterAdmin || false);
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
          setIsMasterAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Failed to verify admin status');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Lägg till online/offline monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!isOnline) {
      throw new Error('Cannot login while offline');
    }

    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Skapa eller uppdatera användardokumentet
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Skapa nytt användardokument för första inloggningen
        await setDoc(userRef, {
          email: userCredential.user.email,
          isAdmin: false,
          isMasterAdmin: false,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } else {
        // Uppdatera senaste inloggning
        await setDoc(userRef, {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }

      // Verifiera admin-status
      const updatedDoc = await getDoc(userRef);
      const userData = updatedDoc.data();
      
      if (!userData?.isAdmin && !userData?.isMasterAdmin) {
        await signOut(auth);
        throw new Error('Unauthorized access - not an admin user');
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      
      let errorMessage = 'Failed to login. Please try again.';
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (authError.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    if (!isOnline) {
      throw new Error('Cannot logout while offline');
    }

    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      setIsMasterAdmin(false);
      
      // Rensa localStorage vid utloggning
      storage.clearAllData();
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
      throw error;
    }
  };

  const value = {
    currentUser,
    isAdmin,
    isMasterAdmin,
    login,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}