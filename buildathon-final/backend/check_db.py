
import os
import sys
from dotenv import load_dotenv

# Load .env explicitly
load_dotenv()

# Add project root to sys.path to find app module
sys.path.append(os.getcwd())

from app.core.firebase import firebase_service
from datetime import datetime, timedelta

def check_and_seed():
    print(f"Checking Firebase Status...", flush=True)
    print(f"Mock Mode: {firebase_service.mock_mode}")
    
    if firebase_service.mock_mode:
        print("System is running in MOCK MODE.")
        print("Real data cannot be fetched from database because no credentials were found.")
        print("However, the code has been updated to return hardcoded mock data.")
    else:
        print("System is running in REAL MODE (Connected to Firestore).")
        
        # Check for appointments
        doctor_id = "doc_mock_001"
        appointments = firebase_service.get_appointments(doctor_id=doctor_id)
        print(f"Found {len(appointments)} appointments for {doctor_id}.")
        
        if len(appointments) == 0:
            print("No appointments found. Seeding database with test data...")
            
            # Seed Data
            seed_data = [
                {
                    "doctor_id": "doc_mock_001",
                    "patient_id": "P-101",
                    "patient_name": "Rahul Verma",
                    "patient_age": 45,
                    "patient_gender": "Male",
                    "appointment_time": (datetime.now() - timedelta(days=2)).isoformat(),
                    "reason": "Chest Pain",
                    "status": "COMPLETED",
                    "slot_time": "10:00 AM",
                    "created_at": datetime.now().isoformat()
                },
                {
                    "doctor_id": "doc_mock_001",
                    "patient_id": "P-104", 
                    "patient_name": "Priya Sharma",
                    "patient_age": 28,
                    "patient_gender": "Female",
                    "appointment_time": datetime.now().isoformat(),
                    "reason": "Severe Migraine",
                    "status": "APPOINTMENT_IN_PROGRESS",
                    "slot_time": "11:30 AM",
                    "created_at": datetime.now().isoformat()
                }
            ]
            
            for apt in seed_data:
                # Use firebase_service.db directly or save_record if collection supported
                # get_appointments reads from "appointments" collection
                try:
                    firebase_service.db.collection("appointments").add(apt)
                    print(f"Seeded appointment for {apt['patient_name']}")
                except Exception as e:
                    print(f"Failed to seed: {e}")
            
            print("Seeding complete. Please refresh the frontend.")
        else:
            print("Database already has data.")

if __name__ == "__main__":
    check_and_seed()
