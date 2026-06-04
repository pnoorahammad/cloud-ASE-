# Deployment Guide

Frontend: Deploy the `frontend` folder to Vercel (or Netlify).

**Vercel settings (important — fixes 404):**
- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment variable: `VITE_API_BASE` = your backend URL (e.g. `https://your-api.onrender.com`)

After deploy, open your site root URL (`/`). Routes like `/login` and `/dashboard` are handled by `vercel.json` rewrites.

Backend: Deploy the `backend` folder to Render (or any Node hosting). Set environment variables from `.env.example` including `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, `SF_REDIRECT_URI`, `JWT_SECRET`, `FRONTEND_URL`, and `MONGO_URI`.

Notes:
- `SF_REDIRECT_URI` must be your **backend** callback, e.g. `https://api.example.com/auth/callback` (not the React app URL).
- `FRONTEND_URL` must match your deployed frontend origin (used after OAuth redirect).
- For production, do NOT run in `SF_SIMULATION_MODE`.
- Use secure secrets management and rotate `JWT_SECRET` periodically.
