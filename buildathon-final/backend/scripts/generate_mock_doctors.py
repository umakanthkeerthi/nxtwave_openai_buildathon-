import json
import random
import datetime

# Mock Data Source
NAMES = [
    "Rajesh Kumar", "Amit Sharma", "Sneha Gupta", "Priya Verma", "Anjali Singh",
    "Vikram Malhotra", "Suresh Patel", "Anita Desai", "Karan Johar", "Manoj Tiwari",
    "Deepika Padukone", "Ranveer Singh", "Shahrukh Khan", "Salman Khan", "Aamir Khan",
    "Narendra Modi", "Rahul Gandhi", "Arvind Kejriwal", "Mamata Banerjee", "Yogi Adityanath",
    "Mahendra Singh Dhoni", "Virat Kohli", "Rohit Sharma", "Sachin Tendulkar", "Sourav Ganguly",
    "Sania Mirza", "PV Sindhu", "Saina Nehwal", "Mary Kom", "Geeta Phogat"
]

SPECIALTIES = [
    "General Physician", "Cardiologist", "Dermatologist", 
    "Pediatrician", "Neurologist", "Orthopedic Surgeon",
    "Gynecologist", "Psychiatrist", "ENT Specialist"
]

# Patient Location: Chanikya Auditorium, New Delhi (Lat: 28.59, Long: 77.19 approx)
# We will use text addresses for simplicity as requested.

NEARBY_LOCATIONS = [
    "Chanakyapuri, New Delhi", "Connaught Place, New Delhi", "South Extension, New Delhi",
    "AIIMS Campus, New Delhi", "Safdarjung Enclave, New Delhi", "Green Park, New Delhi",
    "Hauz Khas, New Delhi", "Defense Colony, New Delhi", "Saket, New Delhi",
    "Vasant Kunj, New Delhi", "Lodhi Road, New Delhi", "Jor Bagh, New Delhi",
    "Greater Kailash, New Delhi", "Nehru Place, New Delhi", "Karol Bagh, New Delhi"
]

FAR_LOCATIONS = [
    "Sector 18, Noida", "Cyber Hub, Gurgaon", "Indirapuram, Ghaziabad",
    "Bandra West, Mumbai", "Koramangala, Bangalore", "T-Nagar, Chennai",
    "Salt Lake, Kolkata", "Banjara Hills, Hyderabad", "Viman Nagar, Pune",
    "Malviya Nagar, Jaipur", "Sector 17, Chandigarh", "Hazratganj, Lucknow",
    "Arera Colony, Bhopal", "Boring Road, Patna", "MG Road, Kochi"
]

def generate_username(name):
    return name.lower().replace(" ", ".")

def generate_doctors():
    doctors = []
    
    # Shuffle names to ensure randomness
    random.shuffle(NAMES)
    
    # 15 Nearby Doctors
    for i in range(15):
        name = NAMES[i]
        username = generate_username(name)
        email = f"{username}@docai.in"
        location = NEARBY_LOCATIONS[i]
        specialty = random.choice(SPECIALTIES)
        doc_id = f"DOC-{1000 + i}"
        
        doctor = {
            "doctor_id": doc_id,
            "name": f"Dr. {name}",
            "email": email,
            "username": username,
            "password": "password123", # Default password for mock
            "specialization": specialty,
            "certification_id": f"CERT-{random.randint(10000, 99999)}",
            "location": location,
            "hospital_id": f"HOSP-DEL-{random.randint(100, 999)}",
            "role": "doctor",
            "is_verified": True,
            "onboarding_complete": True, # Mocking as complete for now
            "distance_category": "near"
        }
        doctors.append(doctor)
        
    # 15 Far Doctors
    for i in range(15):
        name = NAMES[15 + i]
        username = generate_username(name)
        email = f"{username}@docai.in"
        location = FAR_LOCATIONS[i]
        specialty = random.choice(SPECIALTIES)
        doc_id = f"DOC-{2000 + i}"
        
        doctor = {
            "doctor_id": doc_id,
            "name": f"Dr. {name}",
            "email": email,
            "username": username,
            "password": "password123",
            "specialization": specialty,
            "certification_id": f"CERT-{random.randint(10000, 99999)}",
            "location": location,
            "hospital_id": f"HOSP-OUT-{random.randint(100, 999)}",
            "role": "doctor",
            "is_verified": True,
            "onboarding_complete": True,
            "distance_category": "far"
        }
        doctors.append(doctor)
    
    return doctors

if __name__ == "__main__":
    data = generate_doctors()
    
    # Save to file
    with open("mock_doctors.json", "w") as f:
        json.dump(data, f, indent=4)
        
    print(f"SUCCESS: Generated {len(data)} mock doctors in 'mock_doctors.json'.")
    print("Sample (First 3):")
    print(json.dumps(data[:3], indent=2))
