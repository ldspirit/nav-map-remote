import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { registerRoutes } from './routes.js';

dotenv.config();

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : undefined;
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : {}));

app.use(express.json());

// Rate limit auth endpoints (20 requests per 15 min window)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' }
});
app.use('/api/v1/auth', authLimiter);

app.get('/health', async (_req, res) => {
  try {
    await (await import('./db.js')).query('SELECT 1');
    res.json({ ok: true, service: 'api', db: 'ok' });
  } catch {
    res.status(500).json({ ok: false, service: 'api', db: 'fail' });
  }
});

registerRoutes(app);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`api listening on ${port}`);
});
