import os
import base64
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# 1x1 pixel transparant gif/png or just a small valid base64 image
# Read test_lab.png and convert to base64
with open("test_lab.png", "rb") as image_file:
    BASE64_IMAGE = base64.b64encode(image_file.read()).decode('utf-8')

MODELS_TO_TEST = [
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct"
]

def test_model(model_id):
    print(f"\nTesting model: {model_id}")
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What color is this image?"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{BASE64_IMAGE}",
                            },
                        },
                    ],
                }
            ],
            model=model_id,
        )
        print(f"SUCCESS: {model_id}")
        print(chat_completion.choices[0].message.content)
        return True
    except Exception as e:
        print(f"FAILED: {model_id}")
        print(e)
        return False

for model in MODELS_TO_TEST:
    test_model(model)
