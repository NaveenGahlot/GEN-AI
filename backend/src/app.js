import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// required all the routes here
import authRoutes from './routes/auth.routes.js';
import interviewRouter from './routes/interview.routes.js';


const app = express();
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  'https://roleplay-ai.netlify.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}))

// a simple route to test if the server is running or not
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// using all the routes here
app.use('/api/auths', authRoutes);
app.use('/api/interviews', interviewRouter)

export {app};