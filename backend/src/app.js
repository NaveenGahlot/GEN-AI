import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// required all the routes here
import authRoutes from './routes/auth.routes.js';
import interviewRouter from './routes/interview.routes.js';


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

// a simple route to test if the server is running or not
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// using all the routes here
app.use('/api/auths', authRoutes);
app.use('/api/interviews', interviewRouter)

export {app};