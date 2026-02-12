import base64
import json
import os
import io
from PIL import Image
from groq import Groq
from app.core.config import settings

# Initialize Groq Client
client = Groq(api_key=settings.GROQ_API_KEY)

# Model Constants
# User requested "lamma-4 maverick" for vision -> Mapping to Llama-4-Maverick for high quality
VISION_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct" 
# User requested "gpt-oss-120b" for reasoning
REASONING_MODEL = "openai/gpt-oss-120b" 

async def analyze_prescription_image(image_bytes: bytes) -> dict:
    """
    Analyzes a prescription image using a Vision LLM to extract text/structure,
    then uses a Reasoning LLM to structure it into a medical JSON format.
    """
    try:
        # Step 0: Robust Image Processing (Convert to JPEG)
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Convert to RGB to handle PNG/AVIF/RGBA
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Save to JPEG buffer
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=95)
            jpeg_bytes = buffer.getvalue()
        except Exception as img_err:
            print(f"Image Conversion Error: {img_err}")
            # Fallback to original bytes if PIL fails (unlikely if Pillow installed)
            jpeg_bytes = image_bytes

        # Step 1: Vision Model - Extract Raw Text & visual structure
        # Encode image to base64
        base64_image = base64.b64encode(jpeg_bytes).decode('utf-8')
        
        vision_prompt = """
        Analyze this image. It is a medical prescription. 
        Extract ALL text exactly as written, even if handwritten. 
        Don't summarize. I need the exact medicine names, dosages, and instructions.
        Describe the layout briefly.
        Identify the Doctor, Patient Name (if visible), Date, and the list of Medicines/Dosages.
        """
        
        vision_completion = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": vision_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.0,
            max_tokens=2048
        )
        
        raw_extraction = vision_completion.choices[0].message.content
        print(f"DEBUG: Vision RAW Output: {raw_extraction[:200]}...")

        # Step 2: Reasoning Model - Structure into strict JSON
        reasoning_prompt = f"""
        You are a medical expert assistant.
        I will provide raw text extracted from a prescription image.
        Your task is to structure it into a valid JSON object.
        
        RAW TEXT FROM IMAGE:
        \"\"\"{raw_extraction}\"\"\"
        
        REQUIRED JSON STRUCTURE:
        {{
            "doctor_name": "Name or null",
            "hospital_name": "Name or null", 
            "patient_name": "Name or null",
            "date": "YYYY-MM-DD or null",
            "medicines": [
                {{
                    "name": "Medicine Name",
                    "dosage": "e.g. 500mg",
                    "frequency": "e.g. 1-0-1 (Morning-Noon-Night)",
                    "duration": "e.g. 5 days",
                    "instructions": "e.g. After food"
                }}
            ],
            "lab_tests_recommended": ["test 1", "test 2"],
            "general_advice": "Any lifestyle or dietary advice mentioned"
        }}
        
        Return ONLY the JSON. No markdown formatting.
        """
        
        reasoning_completion = client.chat.completions.create(
            model=REASONING_MODEL,
            messages=[
                {"role": "user", "content": reasoning_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        json_str = reasoning_completion.choices[0].message.content
        structured_data = json.loads(json_str)
        
        return structured_data

    except Exception as e:
        print(f"Error in analyze_prescription_image: {e}")
        # Fallback empty structure
        return {
            "error": str(e),
            "doctor_name": None,
            "medicines": []
        }
