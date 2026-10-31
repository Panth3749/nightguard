import { z } from 'zod';
import { DeviceType, DayOfWeek, ScheduleOverrideAction, RouterAdapterType } from './types';

// ==============================================================================
// Authentication Schemas
// ==============================================================================

export const RegisterUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  timezone: z.string().default('UTC'),
});

export const LoginUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ==============================================================================
// Network & Router Schemas
// ==============================================================================

export const CreateNetworkSchema = z.object({
  name: z.string().min(2, 'Network name must be at least 2 characters').max(50),
  ssid: z.string().min(1, 'SSID is required').max(32),
  description: z.string().max(255).optional(),
});

export const PairRouterSchema = z.object({
  networkId: z.string().uuid('Invalid network ID'),
  adapterType: z.nativeEnum(RouterAdapterType).default(RouterAdapterType.OPENWRT),
  isSimulated: z.boolean().default(false),
  model: z.string().optional(),
  gatewayIp: z.string().optional(),
  adminUsername: z.string().optional(),
  adminPassword: z.string().optional(),
});

export const RouterHeartbeatSchema = z.object({
  routerId: z.string(),
  firmwareVersion: z.string().optional(),
  model: z.string().optional(),
  uptimeSeconds: z.number().optional(),
  activeBlockedCount: z.number().default(0),
  loadAverage: z.array(z.number()).optional(),
});

// ==============================================================================
// Device Management Schemas
// ==============================================================================

export const UpdateDeviceSchema = z.object({
  friendlyName: z.string().min(1).max(60).optional(),
  deviceType: z.nativeEnum(DeviceType).optional(),
  notes: z.string().max(255).optional(),
});

export const ToggleDeviceManagementSchema = z.object({
  isManaged: z.boolean(),
});

export const ManualDeviceOverrideSchema = z.object({
  action: z.enum(['RESTRICT_NOW', 'RESTORE_NOW', 'CLEAR_OVERRIDE']),
  durationMinutes: z.number().min(5).max(1440).optional(), // 5 mins to 24 hours
});

// ==============================================================================
// Scheduling Engine Schemas
// ==============================================================================

// Time format HH:mm in 24-hour notation
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const CreateScheduleSchema = z.object({
  networkId: z.string().uuid('Invalid network ID'),
  name: z.string().min(2, 'Schedule name must be at least 2 characters').max(60),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm 24-hour format (e.g. 22:00)'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm 24-hour format (e.g. 07:00)'),
  daysOfWeek: z.array(z.nativeEnum(DayOfWeek)).min(1, 'Please select at least one day of the week'),
  timezone: z.string().min(1, 'Timezone is required'),
  deviceIds: z.array(z.string().uuid()).default([]),
  isEnabled: z.boolean().default(true),
});

export const UpdateScheduleSchema = CreateScheduleSchema.partial().extend({
  isPaused: z.boolean().optional(),
  activeOverride: z.nativeEnum(ScheduleOverrideAction).optional(),
});

// Type inferences
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginUserInput = z.infer<typeof LoginUserSchema>;
export type CreateNetworkInput = z.infer<typeof CreateNetworkSchema>;
export type PairRouterInput = z.infer<typeof PairRouterSchema>;
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;
export type ToggleDeviceManagementInput = z.infer<typeof ToggleDeviceManagementSchema>;
export type ManualDeviceOverrideInput = z.infer<typeof ManualDeviceOverrideSchema>;
export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;
