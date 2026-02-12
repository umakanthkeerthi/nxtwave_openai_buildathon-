
from sentence_transformers import SentenceTransformer
import os

# Define local path
model_path = os.path.join(os.getcwd(), "app", "models", "all-MiniLM-L6-v2")

print(f"⬇️ Downloading model to {model_path}...")
model = SentenceTransformer("all-MiniLM-L6-v2")
model.save(model_path)
print("✅ Model saved locally. You can now commit this folder.")
