# Deployment Guide

Frontend: Deploy the `frontend` folder to Vercel. Set environment variable `VITE_API_BASE` to your backend URL.

Backend: Deploy the `backend` folder to Render (or any Node hosting). Set environment variables from `.env.example` including `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, `SF_REDIRECT_URI`, `JWT_SECRET`, `FRONTEND_URL`, and `MONGO_URI`.

Notes:
- `SF_REDIRECT_URI` must be your **backend** callback, e.g. `https://api.example.com/auth/callback` (not the React app URL).
- `FRONTEND_URL` must match your deployed frontend origin (used after OAuth redirect).
- For production, do NOT run in `SF_SIMULATION_MODE`.
- Use secure secrets management and rotate `JWT_SECRET` periodically.
