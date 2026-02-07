import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function loginWithGoogle() {
        return signInWithPopup(auth, googleProvider);
    }

    function logout() {
        setSelectedProfile(null);
        localStorage.removeItem('selectedProfileId');
        return signOut(auth);
    }

    function selectProfile(profileId) {
        if (!currentUser?.profile?.profiles) return;
        const profile = currentUser.profile.profiles.find(p => p.id === profileId);
        if (profile) {
            setSelectedProfile(profile);
            localStorage.setItem('selectedProfileId', profileId);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("AuthContext: User authenticated", user.uid);

                if (!db) {
                    console.error("AuthContext: Firestore 'db' is not initialized!");
                    setCurrentUser(user);
                    setLoading(false);
                    return;
                }

                // Fetch user doc with timeout
                try {
                    const fetchDoc = async () => {
                        const docRef = doc(db, "users", user.uid);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            return docSnap.data();
                        }
                        return null;
                    };

                    const docData = await fetchDoc();

                    if (docData) {
                        setCurrentUser({ ...user, profile: docData }); // docData contains 'profiles' array

                        // Auto-restore selected profile from localStorage if valid
                        const savedProfileId = localStorage.getItem('selectedProfileId');
                        if (savedProfileId && docData.profiles) {
                            const found = docData.profiles.find(p => p.id === savedProfileId);
                            if (found) setSelectedProfile(found);
                        }
                    } else {
                        setCurrentUser({ ...user, profile: null });
                    }

                } catch (err) {
                    console.error("AuthContext: Error fetching user doc:", err);
                    setCurrentUser({ ...user, profile: null });
                }
            } else {
                setCurrentUser(null);
                setSelectedProfile(null);
                localStorage.removeItem('selectedProfileId');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        selectedProfile,
        selectProfile,
        signup,
        login,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
