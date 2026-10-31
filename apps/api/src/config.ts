import dotenv from 'dotenv';
import path from 'path';

// Load .env file if available
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || 'nightguard_super_secure_jwt_secret_dev_32chars',
  encryptionKey:
    process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  sessionCookieName: 'nightguard_session',
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:4000',
    process.env.WEB_URL,
    process.env.RENDER_EXTERNAL_URL,
  ].filter(Boolean) as string[],
};
