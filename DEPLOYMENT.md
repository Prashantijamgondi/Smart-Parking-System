# Deployment Guide for Smart Parking System

This guide will help you deploy the Smart Parking System to **Render** (Backend) and **Vercel** (Frontend).

## 1. Backend Deployment (Render)

We will deploy the FastAPI backend as a Web Service on Render.

### Prerequisites
- [x] `requirements.txt` is present.
- [x] `Procfile` has been added (I just created this for you).
- [ ] **Database Decision**: Currently using SQLite (`parking_system.db`).
    - **Option A (Easy/Free)**: Stick with SQLite.
        - *Warning*: Data will be lost every time the app restarts or redeploys.
    - **Option B (Recommended)**: Use PostgreSQL.
        - Requires adding `psycopg2-binary` to requirements and changing `database.py` to use a Postgres URL.

### Steps
1. Push your code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Settings:
    - **Root Directory**: `backend`
    - **Runtime**: Python 3
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000` (or use the generic `Procfile` detection)
6. **Environment Variables**:
    Add the following keys from your local `.env`:
    - `BLYNK_AUTH_TOKEN`
    - `TWILIO_ACCOUNT_SID`
    - `TWILIO_AUTH_TOKEN`
    - `EMAIL_SENDER`
    - `EMAIL_PASSWORD`
    - `SECRET_KEY` (if used)

## 2. Frontend Deployment (Vercel)

We will deploy the React frontend to Vercel.

### Steps
1. Go to [Vercel Dashboard](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Settings:
    - **Root Directory**: `frontend` (Vercel should auto-detect "Create React App").
    - **Build Command**: `npm run build`
    - **Output Directory**: `build`
5. **Environment Variables**:
    - `REACT_APP_API_URL`: Set this to your **Render Backend URL** (e.g., `https://smart-parking-api.onrender.com`).
6. Click **Deploy**.

## 3. Hardware (IoT)
Your ESP8266 code communicates with the **Blynk Cloud**, not directly with your backend.
- **No changes needed** to the hardware code as long as your Blynk project remains active.
- The backend syncs with Blynk Cloud, so it will automatically talk to the hardware via Blynk.
