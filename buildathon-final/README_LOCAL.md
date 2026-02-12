# Local Development Guide

## Prerequisites

1.  **Python 3.9+** (Check with `python --version`)
2.  **Node.js 18+** (Check with `node --version`)
3.  **Firebase Credentials**: You must have `serviceAccountKey.json` inside `backend/`.
4.  **Environment Variables**:
    -   `backend/.env`: `GROQ_API_KEY`
    -   `frontend/.env`: `VITE_API_URL`, `VITE_ZEGO_APP_ID`, `VITE_ZEGO_SERVER_SECRET`

---

## 1. Backend Setup (FastAPI)

1.  Open a terminal and navigate to the backend folder:
    ```bash
    cd backend
    ```

2.  (Optional) Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Run the server:
    ```bash
    python main.py
    ```
    *Starts on:* `http://localhost:8004`

---

## 2. Frontend Setup (React + Vite)

1.  Open a **new** terminal (keep the backend one running) and navigate to the frontend folder:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```
    *Starts on:* `http://localhost:5173`

---

## 3. Accessing the App locally

-   **Patient Portal**: Open `http://localhost:5173/patient`
-   **Doctor Portal**: Open `http://localhost:5173/doctor/login`

*Note: Since you are on localhost, the automatic domain redirection (`docai.patient...`) won't trigger. You will use the direct paths above.*
