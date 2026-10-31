import { Router } from 'express';
import { AuthController } from './controllers/authController';
import { NetworkController } from './controllers/networkController';
import { RouterController } from './controllers/routerController';
import { DeviceController } from './controllers/deviceController';
import { ScheduleController } from './controllers/scheduleController';
import { ActivityController } from './controllers/activityController';
import { SystemController } from './controllers/systemController';
import { authenticate } from './middleware/auth';
import { asyncHandler } from './middleware/errorHandler';

const router = Router();

// Public Health & System routes
router.get('/health', asyncHandler(SystemController.getHealth));

// Public Auth routes
router.post('/auth/register', asyncHandler(AuthController.register));
router.post('/auth/login', asyncHandler(AuthController.login));
router.post('/auth/logout', asyncHandler(AuthController.logout));
router.post('/auth/forgot-password', asyncHandler(AuthController.forgotPassword));
router.post('/auth/reset-password', asyncHandler(AuthController.resetPassword));

// Protected Auth routes
router.get('/auth/me', authenticate, asyncHandler(AuthController.getMe));

// Protected System stats
router.get('/system/stats', authenticate, asyncHandler(SystemController.getDashboardStats));

// Protected Networks
router.get('/networks', authenticate, asyncHandler(NetworkController.listNetworks));
router.post('/networks', authenticate, asyncHandler(NetworkController.createNetwork));
router.get('/networks/:id', authenticate, asyncHandler(NetworkController.getNetwork));
router.delete('/networks/:id', authenticate, asyncHandler(NetworkController.deleteNetwork));

// Protected Routers
router.post('/routers/pair', authenticate, asyncHandler(RouterController.pairRouter));
router.get('/routers', authenticate, asyncHandler(RouterController.listRouters));
router.get('/routers/:id/status', authenticate, asyncHandler(RouterController.getRouterStatus));
router.post('/routers/:id/sync', authenticate, asyncHandler(RouterController.syncDevices));
router.post('/routers/:id/emergency-restore', authenticate, asyncHandler(RouterController.emergencyRestore));

// Protected Devices
router.get('/devices', authenticate, asyncHandler(DeviceController.listDevices));
router.get('/devices/:id', authenticate, asyncHandler(DeviceController.getDevice));
router.patch('/devices/:id', authenticate, asyncHandler(DeviceController.updateDevice));
router.patch('/devices/:id/management', authenticate, asyncHandler(DeviceController.toggleManagement));
router.post('/devices/:id/restrict', authenticate, asyncHandler(DeviceController.manualRestrict));
router.post('/devices/:id/restore', authenticate, asyncHandler(DeviceController.manualRestore));

// Protected Schedules
router.get('/schedules', authenticate, asyncHandler(ScheduleController.listSchedules));
router.post('/schedules', authenticate, asyncHandler(ScheduleController.createSchedule));
router.patch('/schedules/:id', authenticate, asyncHandler(ScheduleController.updateSchedule));
router.post('/schedules/:id/toggle', authenticate, asyncHandler(ScheduleController.toggleSchedule));
router.delete('/schedules/:id', authenticate, asyncHandler(ScheduleController.deleteSchedule));

// Protected Activity & Logs
router.get('/activity', authenticate, asyncHandler(ActivityController.listActivity));
router.get('/activity/events', authenticate, asyncHandler(ActivityController.getRecentEvents));

export default router;
