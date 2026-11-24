# EdFlix — AI-Based Smart Learning Recommendation System

Built for **Innovation & Entrepreneurship (DMB0101)** — NIET Greater Noida (Group A-06).

## Quick Start (Local in Cursor / VS Code)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Rename `.env.example` to `.env.local` and add your keys:
   ```env
   GEMINI_API_KEY=your_gemini_key
   YOUTUBE_API_KEY=your_youtube_key
   MONGODB_URI=optional_mongodb_atlas_uri
   ```
3. Run locally:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel
1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Add `GEMINI_API_KEY`, `YOUTUBE_API_KEY`, and (optionally) `MONGODB_URI` under **Project Settings → Environment Variables**.
4. Click **Deploy**!
