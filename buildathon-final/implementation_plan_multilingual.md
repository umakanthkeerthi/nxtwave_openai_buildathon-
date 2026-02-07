# Implementation Plan: Full Multilingual Agent Workflow

## Objective
Ensure all user inputs (Text/Audio) are translated to English for the Agent's internal logic, while all Agent outputs are translated back to the user's preferred language. This ensures high-accuracy medical reasoning (in English) with a localized user experience.

## 1. Backend Updates (`backend/main.py`)

### A. Update `/process_audio` Endpoint
**Goal**: Convert audio to text, and if not English, translate it to English immediately.
- **Current Logic**: Just transcribes.
- **New Logic**:
    1.  Transcribe Audio (Whisper).
    2.  Check Detected Language.
    3.  If not "English", call LLM (Groq/GPT) to translate transcript to English.
    4.  Return JSON:
        ```json
        {
            "original_transcript": " पेट दर्द हो रहा है",
            "english_text": "I have stomach pain",
            "detected_language": "Hindi"
        }
        ```

### B. Update `/chat` Endpoint
**Goal**: Accept a target language and translate the response before sending it back.
- **Update Request Model**: Add `target_language: str` to `ChatRequest`.
- **Logic**:
    1.  Receive `message` (English input from frontend) and `target_language`.
    2.  Run `agent_graph` with the English message.
    3.  Capture `agent_response` (English).
    4.  **Translation Step**: If `target_language` is not "English", call LLM to translate `agent_response` -> `target_language`.
    5.  Return the translated response to the frontend.

## 2. Frontend Updates (`frontend/src/App.jsx`)

### A. State Management
- Use the existing `selectedLang` or add a `detectedLang` state to track what language the user is currently speaking.

### B. Handle Text Input (`handleManualSend`)
- **Current**: calls `/translate_text` -> gets English -> calls `/chat`.
- **New**:
    1.  Call `/translate_text`.
    2.  Capture `detected_language` from the response.
    3.  Call `/chat` with:
        - `message`: `english_text`
        - `target_language`: `detected_language` (or `selectedLang` if manual override).

### C. Handle Audio Input (`handleAudioStop` & `handleConfirm`)
- **Current**: Calls `/process_audio` -> User Confirms -> Calls `/chat`.
- **New**:
    1.  `handleAudioStop`: Update to handle the new backend response (saving both `original_transcript` for display and `english_text` for logic).
    2.  `handleConfirm`:
        -   Send `english_text` to `/chat`.
        -   Pass `target_language` (from the audio detection) to `/chat`.
        -   Display the *Translated Response* returned by the backend.

## 3. Execution Steps
1.  **Modify `backend/main.py`** to implement the translation logic in `/process_audio` and `/chat`.
2.  **Modify `frontend/src/App.jsx`** to pass the correct language flags and handle the translated flow.
3.  **Verify** by speaking in a non-English language (e.g., Hindi) and confirming the Agent reasoning is correct (English logic) but the reply is in Hindi.
