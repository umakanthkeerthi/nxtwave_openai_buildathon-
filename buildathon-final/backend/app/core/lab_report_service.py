import base64
import json
import os
import io
import sys
import traceback
from PIL import Image
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

# Model Constants
VISION_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct" 
REASONING_MODEL = "openai/gpt-oss-120b" 

async def analyze_lab_report_image(image_bytes: bytes) -> dict:
    """
    Analyzes a lab report image using a Vision LLM to extract text/structure,
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
        Analyze this image. It is a medical Lab Report. 
        Extract ALL text exactly as written.
        Identify the Patient Name, Date, and Test Name.
        List all the medical tests performed, their Results, Units, and Reference Ranges if visible.
        Flag any results that are explicitly marked as High, Low, or Abnormal.
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": vision_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}", 
                            },
                        },
                    ],
                }
            ],
            model=VISION_MODEL,
        )

        raw_text_extraction = chat_completion.choices[0].message.content
        print(f"DEBUG: Vision extraction complete. Length: {len(raw_text_extraction)}")

        # Step 2: Reasoning Model - Structure Data
        reasoning_prompt = f"""
        You are a medical data structuring assistant.
        I will provide you with text extracted from a Lab Report image.
        Your job is to convert this text into a strictly structured JSON object.

        RAW TEXT:
        {raw_text_extraction}

        REQUIRED JSON STRUCTURE:
        {{
            "patient_name": "string or null",
            "date": "string or null",
            "lab_name": "string or null",
            "tests": [
                {{
                    "name": "Test Name (e.g. Hemoglobin)",
                    "result": "Value (e.g. 13.5)",
                    "units": "Units (e.g. g/dL)",
                    "reference_range": "Range (e.g. 12.0-15.5)",
                    "status": "Normal | High | Low | Abnormal (derive from text or range)"
                }}
            ],
            "summary": "A patient-friendly summary (4-5 lines). Explain what the results mean in simple terms, skipping technical jargon. Focus on what is good and what needs attention."
        }}

        Return ONLY the JSON. Do not include markdown formatting like ```json.
        """

        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful API that outputs strict JSON."},
                {"role": "user", "content": reasoning_prompt}
            ],
            model=REASONING_MODEL,
            temperature=0.1, 
        )

        structured_response = completion.choices[0].message.content
        
        # Clean cleanup
        structured_response = structured_response.replace("```json", "").replace("```", "").strip()
        
        return json.loads(structured_response)

    except Exception as e:
        print(f"Error in analyze_lab_report_image: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        # Return a fallback error structure
        return {
            "patient_name": None,
            "date": None,
            "tests": [],
            "summary": "Error analyzing report. Please try again."
        }
