# 📊 Geo Alpha — Geo-Financial Market Intelligence Platform

> A beginner-friendly, real-time AI dashboard that fetches financial news, analyzes sentiment, and provides economic reasoning and stock suggestions using Groq AI.

---

## 🧠 How It Works

This project is built to be simple and easy to understand. Here is the flow of data:

1. **Get the News**: The app fetches live financial news (using the free Finnhub API or a fallback method).
2. **AI Sentiment Analysis**: It sends the news text to **Groq AI** to determine if the news is Positive, Negative, or Neutral.
3. **Sector Impact**: It looks for keywords to see which sectors (like Tech, Energy, or Banking) are affected.
4. **AI Reasoning**: It asks **Groq AI** to explain *why* the news matters and how it affects the economy.
5. **Stock Suggestions**: It suggests stocks that might go up (bullish) or down (bearish) based on the affected sectors.

---

## 📁 Project Structure

The project is split into two main parts: the **Backend** (Python) and the **Frontend** (React).

```text
geo-alpha/
├── backend/                  # Python API server
│   ├── app.py                # Main entry point for the backend
│   ├── routes/               # API endpoints (/news, /analyze, /reasoning)
│   ├── services/             # Logic to fetch news and call Groq AI
│   └── requirements.txt      # Python dependencies
└── frontend/                 # React user interface
    ├── src/
    │   ├── App.jsx           # Main dashboard component
    │   ├── components/       # UI building blocks (NewsPanel, StocksPanel)
    │   └── services/api.js   # Code that talks to the backend
    └── package.json          # Node.js dependencies
```

---

## ⚡ How to Set Up Locally

Follow these simple steps to run the project on your own computer!

### 1. Get a Free Groq API Key
Go to [console.groq.com](https://console.groq.com), create a free account, and generate an API key.

### 2. Set Up the Backend (Python)

Open a terminal and navigate to the `backend` folder:
```bash
cd backend
```

Install the required Python packages:
```bash
pip install -r requirements.txt
```

Create your environment variables file:
- Make a copy of `.env.example` and name it `.env`
- Open `.env` and paste your Groq API key:
  `GROQ_API_KEY=your_key_here`

Start the backend server:
```bash
uvicorn app:app --reload --port 8000
```
*Your backend is now running at `http://localhost:8000`*

### 3. Set Up the Frontend (React)

Open a **second** terminal window and navigate to the `frontend` folder:
```bash
cd frontend
```

Install the required Node.js packages:
```bash
npm install
```

Create your environment variables file:
- Make a copy of `.env.example` and name it `.env.local`
- Ensure it points to your local backend:
  `VITE_API_URL=http://localhost:8000`

Start the frontend server:
```bash
npm run dev
```
*Your frontend is now running at `http://localhost:5173`*

Open `http://localhost:5173` in your browser to see the app!

---

## 🚀 How to Deploy Online

### Deploying the Backend (Render)
1. Push your code to GitHub.
2. Go to [Render](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the build command: `pip install -r requirements.txt`
5. Set the start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
6. Go to the "Environment" tab and add your `GROQ_API_KEY`.

### Deploying the Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and import your GitHub repository.
2. During setup, make sure the "Root Directory" is set to `frontend`.
3. Add a new Environment Variable:
   - Key: `VITE_API_URL`
   - Value: `URL_OF_YOUR_RENDER_BACKEND` (e.g., `https://my-backend.onrender.com`)
4. Click Deploy!

---

## 🛠️ Technologies Used

- **Frontend**: React, Vite, TailwindCSS (for beautiful styling).
- **Backend**: Python, FastAPI.
- **AI Engine**: Groq API (super fast LLaMA-3 model for sentiment and reasoning).

---

*Note: This platform is for educational and presentation purposes only. It does not provide real financial advice.*
