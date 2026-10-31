import dotenv from 'dotenv';
import path from 'path';
import { schedulerService } from '@nightguard/scheduler';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

console.log('=====================================================');
console.log('  NightGuard Background Scheduler & Policy Worker');
console.log('  Processing persistent policy queue & router sync');
console.log('=====================================================');

async function main() {
  await schedulerService.start();
}

main().catch((err) => {
  console.error('[WORKER FATAL] Error initializing worker:', err);
  process.exit(1);
});

const shutdown = () => {
  console.log('[WORKER] Shutting down policy worker gracefully...');
  schedulerService.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
