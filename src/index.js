import express from 'express';
import morgan from 'morgan';
import connectToDatabase from './config/db.config.js';
import apiRouter from './routes/index.js';
import config from './config/server.config.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());


app.use('/api', apiRouter);

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(config.port, async () => {
  console.log(`Server is running on https://localhost:${config.port}`);
  await connectToDatabase();
  console.log('Database connection established');
});

export default app;