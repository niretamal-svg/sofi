import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    if (email === "admin@sofi.com" && password === "admin123") {
      setUser({ email: email, uid: "mock-123", getIdToken: async () => "mock-token" });
      return;
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (nombre, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (nombre) {
      await updateProfile(userCredential.user, { displayName: nombre });
    }
    return userCredential;
  };

  const oauthLogin = async (providerName) => {
    let provider;
    if (providerName === 'google') {
      provider = new GoogleAuthProvider();
    } else if (providerName === 'microsoft') {
      provider = new OAuthProvider('microsoft.com');
    } else {
      throw new Error('Proveedor no soportado');
    }
    return signInWithPopup(auth, provider);
  };

  const sendLoginCode = async (email) => {
    // En Firebase usamos el enlace de recuperación en lugar de código numérico
    await sendPasswordResetEmail(auth, email);
    return { message: "Enlace de recuperación enviado al correo." };
  };

  const logout = async () => {
    setUser(null);
    return signOut(auth);
  };

  const getToken = async () => {
    if (user) {
      return user.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, oauthLogin, sendLoginCode, logout, getToken }}>
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
