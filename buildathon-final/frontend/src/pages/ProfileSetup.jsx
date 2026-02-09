import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, Activity, Droplet, Users, Heart } from 'lucide-react';
import { doc, setDoc, updateDoc, arrayUnion, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import './Auth.css'; // Reuse Auth styles

const ProfileSetup = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        dob: '',
        gender: '',
        bloodGroup: '',
        relation: 'Self' // Default to Self
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Updated Imports for Multi-Profile
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            setLoading(true);

            // V1.0 Schema: Create Profile Document
            const profilesRef = doc(collection(db, "profiles")); // Auto-ID
            const newProfileId = profilesRef.id;

            const newProfile = {
                profile_id: newProfileId,
                owner_uid: currentUser.uid, // Link to User
                ...formData,
                role: 'patient',
                created_at: new Date().toISOString(),
                is_active: true
            };

            await setDoc(profilesRef, newProfile);
            console.log("Profile Created:", newProfileId);

            // Update User Onboarding Status & Role
            const userRef = doc(db, "users", currentUser.uid);
            await setDoc(userRef, {
                onboarding_completed: true,
                role: 'patient', // Explicitly set role
                updated_at: new Date().toISOString()
            }, { merge: true });

            // Redirect to profile selection
            window.location.href = "/profiles";
        } catch (err) {
            console.error("Error saving profile:", err);
            alert("Failed to save profile.");
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="auth-header">
                    <h2>Complete Your Profile</h2>
                    <p>Tell us a bit about yourself</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form profile-grid">
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Age</label>
                            <div className="input-wrapper">
                                <Activity size={18} className="input-icon" />
                                <input name="age" type="number" value={formData.age} onChange={handleChange} required placeholder="25" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <div className="input-wrapper">
                                <Calendar size={18} className="input-icon" />
                                <input name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} required className="auth-select">
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Blood Group</label>
                            <div className="input-wrapper">
                                <Droplet size={18} className="input-icon" />
                                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required className="auth-select-in-wrapper">
                                    <option value="">Select</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Relation (Who is this profile for?)</label>
                        <div className="input-wrapper">
                            <Users size={18} className="input-icon" />
                            <select name="relation" value={formData.relation} onChange={handleChange} className="auth-select-in-wrapper">
                                <option value="Self">Self</option>
                                <option value="Parent">Parent</option>
                                <option value="Child">Child</option>
                                <option value="Spouse">Spouse</option>
                            </select>
                        </div>
                    </div>

                    <button disabled={loading} className="btn-primary auth-btn" type="submit">
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ProfileSetup;
