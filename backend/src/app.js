import express from 'express';


// required all the routes here
import authRoutes from './routes/auth.routes.js';


const app = express();
app.use(express.json());

// a simple route to test if the server is running or not
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// using all the routes here
app.use('/api/auths', authRoutes);

export {app};