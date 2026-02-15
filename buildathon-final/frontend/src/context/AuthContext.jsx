import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore'; // [UPDATED]
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
                    let userData = userDocSnap.exists() ? userDocSnap.data() : {};

                    // [NEW] Auto-Link Logic for Pre-Seeded Doctors
                    if (!userData.doctor_id && user.email) {
                        try {
                            const doctorsRef = collection(db, "doctors");
                            const q = query(doctorsRef, where("email", "==", user.email));
                            const querySnapshot = await getDocs(q);

                            if (!querySnapshot.empty) {
                                const docData = querySnapshot.docs[0].data();
                                const foundDoctorId = docData.doctor_id || querySnapshot.docs[0].id;
                                console.log(`AuthContext: Auto-linking ${user.email} -> ${foundDoctorId}`);

                                // 1. Save to User Profile
                                await setDoc(userDocRef, { doctor_id: foundDoctorId }, { merge: true });

                                // 2. Update local state
                                userData.doctor_id = foundDoctorId;
                            }
                        } catch (linkErr) {
                            console.error("AuthContext: Auto-link failed", linkErr);
                        }
                    }


                    // [NEW] Fetch Doctor Profile if linked
                    if (userData.doctor_id) {
                        try {
                            const docRef = doc(db, "doctors", userData.doctor_id);
                            const docSnap = await getDoc(docRef);
                            if (docSnap.exists()) {
                                userData.doctorProfile = docSnap.data();
                            }
                        } catch (e) {
                            console.error("AuthContext: Error fetching doctor profile", e);
                        }
                    }

                    // 2. Fetch Profiles Collection (V1.0 Schema)
                    const profilesRef = collection(db, "profiles");
                    const q = query(profilesRef, where("owner_uid", "==", user.uid));
                    const querySnapshot = await getDocs(q);

                    const profiles = [];
                    querySnapshot.forEach((doc) => {
                        profiles.push({ ...doc.data(), id: doc.id });
                    });

                    // Attach profiles to currentUser object for easy access
                    // [FIX] Explicitly copy core Auth fields because {...user} might miss non-enumerable properties
                    const userWithProfiles = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        ...userData,
                        profiles: profiles,
                        _authObject: user // Keep original just in case
                    };
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
