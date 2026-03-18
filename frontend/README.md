# Frontend README

This frontend is a React + Vite application for authentication, interview report management, and resume PDF download.

## Stack

- React 19
- Vite
- React Router
- Axios
- Sass
- React Toastify

## Install and Run

```bash
cd frontend
npm install
npm run dev
```

Other scripts:

```bash
npm run build
npm run preview
npm run lint
```

## Frontend Structure

- App entry: [src/main.jsx](/d:/GEN-AI%20Project/frontend/src/main.jsx)
- Root app: [src/App.jsx](/d:/GEN-AI%20Project/frontend/src/App.jsx)
- Routes: [src/app.routes.jsx](/d:/GEN-AI%20Project/frontend/src/app.routes.jsx)

## Pages

- Login page: [src/features/auth/pages/Login.jsx](/d:/GEN-AI%20Project/frontend/src/features/auth/pages/Login.jsx)
- Register page: [src/features/auth/pages/Register.jsx](/d:/GEN-AI%20Project/frontend/src/features/auth/pages/Register.jsx)
- Home page: [src/features/interview/pages/home.jsx](/d:/GEN-AI%20Project/frontend/src/features/interview/pages/home.jsx)
- Interview detail page: [src/features/interview/pages/interview.jsx](/d:/GEN-AI%20Project/frontend/src/features/interview/pages/interview.jsx)

## Routing

Current routes:

- `/login`
- `/register`
- `/`
- `/interview/:interviewId`

Protected routes are wrapped by [src/features/auth/components/Protected.jsx](/d:/GEN-AI%20Project/frontend/src/features/auth/components/Protected.jsx).

## API Configuration

The frontend reads the backend base URL from:

- `VITE_API_BASE_URL`

If it is not provided:

- local frontend uses `http://localhost:8080`
- deployed frontend falls back to `https://roleplay-ai-rob1.onrender.com`

Reference:

- API base helper: [src/lib/authToken.js](/d:/GEN-AI%20Project/frontend/src/lib/authToken.js)

## Auth Flow

- JWT is stored in local storage under `roleplay_ai_token`
- Axios request interceptors attach the bearer token automatically
- `401` responses clear the stored token

Relevant files:

- Auth context: [src/features/auth/auth.context.jsx](/d:/GEN-AI%20Project/frontend/src/features/auth/auth.context.jsx)
- Auth hook: [src/features/auth/hooks/useAuth.js](/d:/GEN-AI%20Project/frontend/src/features/auth/hooks/useAuth.js)
- Auth API service: [src/features/auth/services/auth.api.js](/d:/GEN-AI%20Project/frontend/src/features/auth/services/auth.api.js)

## Interview Features

- Upload resume PDF and generate interview report
- View interview report details
- List saved interview reports
- Download generated resume PDF

Relevant files:

- Interview context: [src/features/interview/interview.context.jsx](/d:/GEN-AI%20Project/frontend/src/features/interview/interview.context.jsx)
- Interview hook: [src/features/interview/hooks/useInterview.js](/d:/GEN-AI%20Project/frontend/src/features/interview/hooks/useInterview.js)
- Interview API service: [src/features/interview/services/interview.api.js](/d:/GEN-AI%20Project/frontend/src/features/interview/services/interview.api.js)

## Styling

Styling is currently built with CSS and Sass files such as:

- [src/index.css](/d:/GEN-AI%20Project/frontend/src/index.css)
- [src/App.css](/d:/GEN-AI%20Project/frontend/src/App.css)
- [src/style.scss](/d:/GEN-AI%20Project/frontend/src/style.scss)
- [src/features/auth/auth.form.scss](/d:/GEN-AI%20Project/frontend/src/features/auth/auth.form.scss)
- [src/features/interview/style/home.scss](/d:/GEN-AI%20Project/frontend/src/features/interview/style/home.scss)
- [src/features/interview/style/interview.scss](/d:/GEN-AI%20Project/frontend/src/features/interview/style/interview.scss)
