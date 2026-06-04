# Salesforce Validation Rule Manager

This workspace contains a backend (Node.js + Express + JSForce) and a frontend (React + TypeScript + MUI).

Copy `backend/.env.example` to `backend/.env` and configure Salesforce credentials (or set `SF_SIMULATION_MODE=true` for local testing without Salesforce).

Run backend:

```powershell
cd backend
npm install
npm run dev
```

Run frontend (http://localhost:3000):

```powershell
cd frontend
npm install
npm run dev
```

Salesforce Connected App callback URL must be `http://localhost:5000/auth/callback` (backend port).
