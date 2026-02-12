import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

email = "shahrukh.khan@docai.in" # Example doctor email

print(f"Checking user with email: {email}")

users_ref = db.collection("users")
query = users_ref.where("email", "==", email).stream()

found = False
for user in query:
    found = True
    data = user.to_dict()
    print(f"User Found: ID={user.id}")
    print(f"Role: {data.get('role')}")
    print(f"Email: {data.get('email')}")
    
    if data.get('role') != 'doctor':
        print("WARNING: User exists but role is NOT 'doctor'")
    else:
        print("SUCCESS: User exists and has 'doctor' role")

if not found:
    print("ERROR: User not found in 'users' collection with this email.")
