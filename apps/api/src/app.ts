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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

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
