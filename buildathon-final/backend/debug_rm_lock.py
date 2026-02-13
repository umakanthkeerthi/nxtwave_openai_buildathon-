import os
import time

lock_file = r"c:\Users\polur\.gemini\antigravity\scratch\toplabs_docai_v2\.git\index.lock"
print(f"Attempting to delete: {lock_file}")

max_retries = 5
for i in range(max_retries):
    try:
        if os.path.exists(lock_file):
            os.remove(lock_file)
            print("Successfully deleted lock file")
            break
        else:
            print("Lock file not found (already clean)")
            break
    except OSError as e:
        print(f"Attempt {i+1} failed: {e}")
        time.sleep(1)
else:
    print("Could not delete file after retries")
