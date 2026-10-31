import http from 'http';
import app from './app';
import { config } from './config';
import { wsManager } from './websocket/wsServer';
import { schedulerService } from '@nightguard/scheduler';

const server = http.createServer(app);

// Attach WebSocket Server
wsManager.initialize(server);

// Start Server
server.listen(config.port, async () => {
  console.log(`=====================================================`);
  console.log(`  NightGuard API & WebSocket Server running on port ${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  WebSocket Endpoints:`);
  console.log(`    - Dashboard Live Bus: ws://localhost:${config.port}/ws/dashboard`);
  console.log(`    - OpenWrt Router Agent: ws://localhost:${config.port}/ws/router`);
  console.log(`=====================================================`);

  // Start scheduler engine
  try {
    await schedulerService.start();
  } catch (err) {
    console.error('Failed to start policy scheduler:', err);
  }
});

// Graceful shutdown
const shutdown = () => {
  console.log('Received termination signal. Shutting down gracefully...');
  schedulerService.stop();
  server.close(() => {
    console.log('HTTP and WebSocket server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
