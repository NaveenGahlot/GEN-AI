# Backend README

This backend is an Express API for authentication, interview report generation, and resume PDF generation.

## Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Google Gemini integration
- Puppeteer-based PDF generation

## Entry Points

- App entry: [index.js](/d:/GEN-AI%20Project/backend/index.js)
- Express setup: [src/app.js](/d:/GEN-AI%20Project/backend/src/app.js)
- Database config: [src/config/database.js](/d:/GEN-AI%20Project/backend/src/config/database.js)

## Install and Run

```bash
cd backend
npm install
npm start
```

The server currently listens on port `8080`.

## Required Environment Variables

Create a `.env` file in `backend/` and configure:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

Optional variables:

```env
MONGO_URL=your_mongodb_connection_string_fallback
GEMINI_MODEL=gemini-2.0-flash
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
```

## API Modules

- Auth routes: [src/routes/auth.routes.js](/d:/GEN-AI%20Project/backend/src/routes/auth.routes.js)
- Interview routes: [src/routes/interview.routes.js](/d:/GEN-AI%20Project/backend/src/routes/interview.routes.js)
- Auth controller: [src/controllers/auth.controller.js](/d:/GEN-AI%20Project/backend/src/controllers/auth.controller.js)
- Interview controller: [src/controllers/interview.controller.js](/d:/GEN-AI%20Project/backend/src/controllers/interview.controller.js)
- AI service: [src/services/ai.service.js](/d:/GEN-AI%20Project/backend/src/services/ai.service.js)

## Available Endpoints

### Auth

- `POST /api/auths/register`
- `POST /api/auths/login`
- `GET /api/auths/logout`
- `GET /api/auths/get-me`

### Interviews

- `POST /api/interviews/`
  Upload a resume PDF and generate an interview report.
- `GET /api/interviews/`
  Fetch all interview reports for the authenticated user.
- `GET /api/interviews/report/:interviewId`
  Fetch one interview report by id.
- `POST /api/interviews/resume/pdf/:interviewReportId`
  Generate a resume PDF from a stored interview report.

## Authentication

- The backend supports JWT from either:
  - the `jwt` cookie
  - the `Authorization: Bearer <token>` header
- Logged-out tokens are blacklisted.

Relevant files:

- JWT middleware: [src/middlewares/auth.middleware.js](/d:/GEN-AI%20Project/backend/src/middlewares/auth.middleware.js)
- Token creation: [src/jwt/AuthToken.js](/d:/GEN-AI%20Project/backend/src/jwt/AuthToken.js)

## File Uploads

- Resume uploads use Multer memory storage.
- Maximum file size is `3 MB`.

File reference:

- Upload middleware: [src/middlewares/file.middleware.js](/d:/GEN-AI%20Project/backend/src/middlewares/file.middleware.js)

## PDF Generation

- Resume PDFs are rendered from generated HTML using Puppeteer.
- In production, the backend is prepared to use `@sparticuz/chromium`.
- A unique browser profile directory is used for each request and cleaned afterward.

## CORS

Allowed origins currently include:

- `http://localhost:5173`
- `https://roleplay-ai.netlify.app`

This is configured in [src/app.js](/d:/GEN-AI%20Project/backend/src/app.js).
