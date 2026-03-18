# Roleplay AI

Roleplay AI is a full-stack interview preparation project with a React frontend and a Node.js/Express backend. Users can register, upload a resume PDF, generate AI-assisted interview reports, review saved reports, and download a formatted resume PDF.

## Project Structure

```text
.
|-- backend/
|-- frontend/
|-- netlify.toml
```

## Main Features

- User registration, login, logout, and authenticated profile lookup
- Resume PDF upload and text extraction
- AI-generated interview reports based on resume, self-description, and job description
- Saved interview report listing and detail pages
- Resume PDF generation from stored interview data

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Sass
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT via cookie and bearer token support
- AI: Google Gemini via `@google/genai`
- PDF: `pdf-parse`, `puppeteer`, `@sparticuz/chromium`

## Applications

- Frontend README: [frontend/README.md](/d:/GEN-AI%20Project/frontend/README.md)
- Backend README: [backend/README.md](/d:/GEN-AI%20Project/backend/README.md)

## Local Development

1. Install backend dependencies.
2. Install frontend dependencies.
3. Configure backend environment variables.
4. Start the backend server.
5. Start the frontend dev server.

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment Overview

Backend variables used in the current codebase:

- `MONGO_URI` or `MONGO_URL`
- `JWT_SECRET`
- `GOOGLE_GENAI_API_KEY`
- `GEMINI_MODEL` optional
- `NODE_ENV`
- `PUPPETEER_EXECUTABLE_PATH` optional

Frontend variables:

- `VITE_API_BASE_URL` optional

## Deployment Notes

- The frontend is configured for Netlify.
- The backend allows CORS for `http://localhost:5173` and `https://roleplay-ai.netlify.app`.
- In production, resume PDF generation should use `@sparticuz/chromium`.

## API Summary

- `POST /api/auths/register`
- `POST /api/auths/login`
- `GET /api/auths/logout`
- `GET /api/auths/get-me`
- `POST /api/interviews/`
- `GET /api/interviews/`
- `GET /api/interviews/report/:interviewId`
- `POST /api/interviews/resume/pdf/:interviewReportId`
