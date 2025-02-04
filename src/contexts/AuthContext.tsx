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
import { AnalyticsService } from '@/services/analyticsService';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Separate AuthProvider from AuthContext to allow for testing without Firebase
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if user is an admin or master admin
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid)); // Get the user document from Firestore
          const userData = userDoc.data(); // Get the user data from the document if it exists in Firestore 
          setIsAdmin(userData?.isAdmin || false); // Set isAdmin to true if the user is an admin
          setIsMasterAdmin(userData?.isMasterAdmin || false); // Set isMasterAdmin to true if the user is a master admin
          setCurrentUser(user); // Set the current user 
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

    return () => {
      window.removeEventListener('online', handleOnline); // Remove the event listener for online status when the component unmounts 
      window.removeEventListener('offline', handleOffline); // Remove the event listener for offline status when the component unmounts
      unsubscribe(); // Unsubscribe from the onAuthStateChanged listener when the component unmounts for cleanup
    };
  }, []);

  // Login function to authenticate the user with email and password 
  const login = async (email: string, password: string) => {
    const analytics = AnalyticsService.getInstance();

    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) { // If the user document does not exist in Firestore, create a new user document
        await setDoc(userRef, { // Set the user document with the user data
          email: userCredential.user.email, // Set the email
          isAdmin: false, // Set isAdmin to false
          isMasterAdmin: false, // Set isMasterAdmin to false
          createdAt: new Date().toISOString(), // Set the createdAt timestamp
          lastLogin: new Date().toISOString() // Set the lastLogin timestamp
        });
      } else {
        await setDoc(userRef, { 
          lastLogin: new Date().toISOString()
        }, { merge: true }); // merge the lastLogin timestamp with the existing user document
      }

      // Check if the user is an admin or master admin after login 
      const updatedDoc = await getDoc(userRef);
      const userData = updatedDoc.data();
      
      if (!userData?.isAdmin && !userData?.isMasterAdmin) { // If the user is not an admin or master admin, sign out the user
        await signOut(auth);
        throw new Error('Unauthorized access - not an admin user');
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      
      // Set the error message based on the error code 
      let errorMessage = 'Failed to login. Please try again.';
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (authError.code === 'auth/too-many-requests') { // If there are too many failed attempts, show an error message
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout function to sign out the user 
  const logout = async () => { // async function to handle the logout process. async functions return a promise
    if (!isOnline) {
      throw new Error('Cannot logout while offline');
    }

    try {
      await signOut(auth); // Sign out the user by calling the signOut function from the auth module
      setCurrentUser(null); // Set the current user to null 
      setIsAdmin(false); // Set isAdmin to false
      setIsMasterAdmin(false); // Set isMasterAdmin to false
      storage.clearAllData(); // Clear all data from the storage service for cleanup and security
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
    // Provide the value to the context provider component defined above
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context in components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}