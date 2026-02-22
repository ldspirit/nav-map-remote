import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoutes } from './routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'api' });
});

registerRoutes(app);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`api listening on ${port}`);
});
