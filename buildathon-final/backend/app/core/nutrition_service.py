import json
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

async def analyze_meal_text(description: str):
    """
    Analyzes a natural language meal description and returns nutritional data.
    """
    prompt = f"""
    Analyze the following meal description and estimate the nutritional content.
    Return a strictly valid JSON object. Do not include markdown formatting like ```json.
    
    MEAL: "{description}"
    
    OUTPUT FORMAT:
    {{
        "food_items": ["item 1", "item 2"],
        "total_calories": 0,
        "protein_g": 0,
        "carbs_g": 0,
        "fats_g": 0,
        "fiber_g": 0,
        "sugar_g": 0
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview", # Using a strong text model
            messages=[
                {"role": "system", "content": "You are an expert nutritionist AI. Return JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Meal Analysis Error: {e}")
        return {
            "food_items": [],
            "total_calories": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fats_g": 0,
            "fiber_g": 0,
            "sugar_g": 0,
            "error": str(e)
        }

async def get_nutrition_suggestion(profile: dict, current_log: dict):
    """
    Generates a smart suggestion and meal quality score based on the user's profile and daily log.
    profile: { goal: 'Fat Loss', weight: 70, ... }
    current_log: { calories: 1200, protein: 40, ... }
    """
    prompt = f"""
    Analyze the user's daily nutrition status and provide a smart suggestion.
    
    USER PROFILE:
    - Goal: {profile.get('goal', 'Maintenance')}
    - Weight: {profile.get('currentWeight', 'N/A')} kg
    - Diet: {profile.get('dietType', 'N/A')}
    
    TODAY'S LOG SO FAR:
    - Calories: {current_log.get('calories', 0)}
    - Protein: {current_log.get('protein', 0)}g
    - Carbs: {current_log.get('carbs', 0)}g
    
    OUTPUT FORMAT JSON:
    {{
        "suggestion": "...", # Short, actionable advice (1-2 sentences). specific food items.
        "meal_quality_score": 0.0, # 0 to 10 float
        "score_breakdown": {{
            "protein_score": 0, # 0-100
            "fiber_score": 0, # 0-100
            "balance_score": 0 # 0-100
        }}
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {"role": "system", "content": "You are a personalized nutrition coach. Return JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Suggestion Error: {e}")
        return {
            "suggestion": "Focus on a balanced diet.",
            "meal_quality_score": 5.0,
            "score_breakdown": {"protein_score": 50, "fiber_score": 50, "balance_score": 50}
        }

async def generate_diet_plan(profile: dict):
    """
    Generates a 3-day personalized diet plan based on user profile.
    """
    prompt = f"""
    Create a personalized 3-day diet plan for the following user:
    
    PROFILE:
    - Goal: {profile.get('goal', 'Maintenance')}
    - Weight: {profile.get('currentWeight', 'N/A')} kg
    - Height: {profile.get('height', 'N/A')} cm
    - Age: {profile.get('age', 'N/A')}
    - Gender: {profile.get('gender', 'N/A')}
    - Activity: {profile.get('activityLevel', 'Moderate')}
    - Diet Type: {profile.get('dietType', 'Balanced')}
    - Cuisines: {', '.join(profile.get('cuisine', []))}
    - Allergies: {', '.join(profile.get('allergies', []))}
    - Meals Per Day: {profile.get('mealsPerDay', 3)}
    
    OUTPUT FORMAT JSON:
    {{
        "plan": [
            {{
                "day": 1,
                "meals": [
                    {{ "type": "Breakfast", "item": "...", "calories": 0, "protein": 0 }},
                    {{ "type": "Lunch", "item": "...", "calories": 0, "protein": 0 }},
                    {{ "type": "Snack", "item": "...", "calories": 0, "protein": 0 }},
                    {{ "type": "Dinner", "item": "...", "calories": 0, "protein": 0 }}
                ]
            }},
            ... (Day 2 and 3)
        ],
        "summary": "Brief explanation of why this plan works for the user."
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {"role": "system", "content": "You are an expert nutritionist. Create a practical, culturally appropriate meal plan. Return JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Diet Plan Error: {e}")
        return {"error": str(e)}

