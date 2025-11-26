# The Echo-Chamber Breaker

A browser extension + web app that helps users break out of their ideological echo chambers by finding high-quality steel-man counter-arguments.

## Features

- **URL Analyzer**: Extracts claims, topic, and political bias from any news article.
- **Bias Meter**: Visualizes the ideological leaning (Left/Right/Center).
- **Counter-Argument Finder**: Recommends the strongest opposing viewpoints from reputable sources.
- **Steel-Man Approach**: Focuses on constructive, good-faith arguments, not debunking.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Framer Motion, Zustand.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL (Schema provided).
- **AI/ML**: Modular service architecture (Currently using mock services for demo).

## Getting Started

### Prerequisites
- Node.js installed.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd perspective-bridge
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Server runs on `http://localhost:3000`.

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   App runs on `http://localhost:5173`.

3. **Usage**
   - Open the frontend URL.
   - Paste a news article URL (e.g., from CNN or Fox News).
   - Click "Analyze".
   - View the bias score and recommended counter-arguments.

## Project Structure

- `/backend`: Express server and API routes.
- `/frontend`: React application.
- `/database`: SQL schema for Supabase/Postgres.

## Future Roadmap

- Integrate real OpenAI/Gemini API for live analysis.
- Implement Vector DB (Pinecone) for semantic search of arguments.
- Build the Browser Extension using the same API.
