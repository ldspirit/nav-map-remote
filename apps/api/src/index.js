import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoutes } from './routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    // simple DB check
    await (await import('./db.js')).query('SELECT 1');
    res.json({ ok: true, service: 'api', db: 'ok' });
  } catch (e) {
    res.status(500).json({ ok: false, service: 'api', db: 'fail' });
  }
});

registerRoutes(app);

// basic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`api listening on ${port}`);
});
