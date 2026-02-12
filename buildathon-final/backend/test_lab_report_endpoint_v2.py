import requests
from PIL import Image
import io

url = "http://localhost:8003/analyze_lab_report"

# Create a valid 100x100 image
img = Image.new('RGB', (100, 100), color = 'red')
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='PNG')
img_byte_arr.seek(0)

try:
    files = {'file': ('test.png', img_byte_arr, 'image/png')}
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
