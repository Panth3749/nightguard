import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

const app = express();

// Trust reverse proxy (Render / Cloudflare)
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // allow modern SPA and WebSocket transport
  })
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, router agents, or same-origin)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Auth rate limiting to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// General rate limiter (generous to avoid false 429s on dashboard operations, skips health check)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.includes('/health'),
});
app.use('/api', generalLimiter);

// Serve OpenWrt agent installer directly
app.get('/agent/install.sh', (req, res) => {
  const installerPath = path.resolve(__dirname, '../../../router-software/openwrt/install.sh');
  if (fs.existsSync(installerPath)) {
    res.setHeader('Content-Type', 'text/x-shellscript');
    fs.createReadStream(installerPath).pipe(res);
  } else {
    res.status(404).send('# NightGuard installer not found');
  }
});

// API Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

export default app;
