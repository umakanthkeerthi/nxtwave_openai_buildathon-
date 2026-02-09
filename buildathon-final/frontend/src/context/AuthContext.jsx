import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; // [UPDATED]
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
        if (!currentUser?.profiles) return; // [UPDATED] Check profiles array attached to user
        const profile = currentUser.profiles.find(p => p.profile_id === profileId || p.id === profileId);
        if (profile) {
            setSelectedProfile(profile);
            localStorage.setItem('selectedProfileId', profile.profile_id || profile.id);
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

                try {
                    // 1. Fetch User Doc (Role, etc.)
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    const userData = userDocSnap.exists() ? userDocSnap.data() : {};

                    // 2. Fetch Profiles Collection (V1.0 Schema)
                    const profilesRef = collection(db, "profiles");
                    const q = query(profilesRef, where("owner_uid", "==", user.uid));
                    const querySnapshot = await getDocs(q);

                    const profiles = [];
                    querySnapshot.forEach((doc) => {
                        profiles.push({ ...doc.data(), id: doc.id });
                    });

                    // Attach profiles to currentUser object for easy access
                    const userWithProfiles = { ...user, ...userData, profiles: profiles };
                    setCurrentUser(userWithProfiles);

                    // 3. Auto-restore selected profile
                    const savedProfileId = localStorage.getItem('selectedProfileId');
                    if (savedProfileId && profiles.length > 0) {
                        const found = profiles.find(p => p.profile_id === savedProfileId || p.id === savedProfileId);
                        if (found) {
                            setSelectedProfile(found);
                        } else {
                            // Default to first profile if saved one not found
                            setSelectedProfile(profiles[0]);
                        }
                    } else if (profiles.length > 0) {
                        // Default to first profile
                        setSelectedProfile(profiles[0]);
                    }

                } catch (err) {
                    console.error("AuthContext: Error fetching user/profiles:", err);
                    setCurrentUser(user);
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
