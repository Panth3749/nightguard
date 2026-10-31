// ==============================================================================
// NightGuard Shared Type Definitions
// ==============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum RouterAdapterType {
  OPENWRT = 'OPENWRT',
  SIMULATOR = 'SIMULATOR',
  GENERIC_LINUX = 'GENERIC_LINUX',
}

export enum RouterConnectionStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  PAIRING = 'PAIRING',
  DEGRADED = 'DEGRADED',
}

export enum DeviceType {
  SMARTPHONE = 'SMARTPHONE',
  LAPTOP = 'LAPTOP',
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  SMART_TV = 'SMART_TV',
  GAMING_CONSOLE = 'GAMING_CONSOLE',
  OTHER = 'OTHER',
}

export enum RestrictionStatus {
  NOT_MANAGED = 'NOT_MANAGED',
  SCHEDULED = 'SCHEDULED',
  PENDING = 'PENDING',
  RESTRICTION_ACTIVE = 'RESTRICTION_ACTIVE',
  RESTORATION_PENDING = 'RESTORATION_PENDING',
  FAILED = 'FAILED',
  ROUTER_OFFLINE = 'ROUTER_OFFLINE',
}

export enum DeviceConnectionState {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  IDLE = 'IDLE',
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum ScheduleOverrideAction {
  NONE = 'NONE',
  RESTRICT_NOW = 'RESTRICT_NOW',
  RESTORE_NOW = 'RESTORE_NOW',
}

export enum RouterCommandType {
  BLOCK_MAC = 'BLOCK_MAC',
  UNBLOCK_MAC = 'UNBLOCK_MAC',
  GET_CLIENTS = 'GET_CLIENTS',
  GET_FIREWALL_RULES = 'GET_FIREWALL_RULES',
  FLUSH_RULES = 'FLUSH_RULES',
  PING = 'PING',
}

export enum RouterCommandStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export enum AuditAction {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  NETWORK_CREATED = 'NETWORK_CREATED',
  NETWORK_DELETED = 'NETWORK_DELETED',
  ROUTER_PAIR_REQUESTED = 'ROUTER_PAIR_REQUESTED',
  ROUTER_PAIRED = 'ROUTER_PAIRED',
  ROUTER_STATUS_CHANGED = 'ROUTER_STATUS_CHANGED',
  DEVICE_DISCOVERED = 'DEVICE_DISCOVERED',
  DEVICE_UPDATED = 'DEVICE_UPDATED',
  MANAGEMENT_TOGGLED = 'MANAGEMENT_TOGGLED',
  SCHEDULE_CREATED = 'SCHEDULE_CREATED',
  SCHEDULE_UPDATED = 'SCHEDULE_UPDATED',
  SCHEDULE_DELETED = 'SCHEDULE_DELETED',
  SCHEDULE_TOGGLED = 'SCHEDULE_TOGGLED',
  RESTRICTION_APPLIED = 'RESTRICTION_APPLIED',
  RESTORATION_APPLIED = 'RESTORATION_APPLIED',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE',
  EMERGENCY_OVERRIDE = 'EMERGENCY_OVERRIDE',
  COMMAND_FAILED = 'COMMAND_FAILED',
}

// Router and Device Data Transfer Objects
export interface DiscoveredDevice {
  macAddress: string;
  ipAddress: string;
  hostname?: string;
  vendor?: string;
  interface?: string;
  signalStrength?: number;
  lastSeen: Date | string;
}

export interface RouterCapabilities {
  supportsNftables: boolean;
  supportsUbus: boolean;
  supportsPerDeviceBandwidth: boolean;
  supportsDnsBlocking: boolean;
  supportsVlan: boolean;
  supportsGuestIsolation: boolean;
  maxManagedDevices: number;
}

export interface RouterHealthResult {
  isOnline: boolean;
  latencyMs: number;
  firmwareVersion?: string;
  model?: string;
  activeBlockedCount: number;
  cpuLoadPercent?: number;
  memoryUsagePercent?: number;
  lastError?: string;
}

export interface RouterCommandPayload {
  commandId: string;
  type: RouterCommandType;
  targetMac?: string;
  targetIp?: string;
  idempotencyKey: string;
  issuedAt: string;
  payload?: Record<string, unknown>;
}

export interface RouterCommandResult {
  commandId: string;
  success: boolean;
  executedAt: string;
  errorMessage?: string;
  output?: Record<string, unknown>;
}

// WebSocket Event Enums and Payloads
export enum WsClientEventType {
  DASHBOARD_SUBSCRIBE = 'DASHBOARD_SUBSCRIBE',
  DEVICE_UPDATE = 'DEVICE_UPDATE',
  ROUTER_STATUS_UPDATE = 'ROUTER_STATUS_UPDATE',
  RESTRICTION_EVENT = 'RESTRICTION_EVENT',
  SCHEDULE_TRIGGERED = 'SCHEDULE_TRIGGERED',
  AUDIT_LOG_ENTRY = 'AUDIT_LOG_ENTRY',
}

export enum WsRouterEventType {
  AGENT_AUTH = 'AGENT_AUTH',
  AGENT_HEARTBEAT = 'AGENT_HEARTBEAT',
  AGENT_DISCOVERY_REPORT = 'AGENT_DISCOVERY_REPORT',
  AGENT_COMMAND_ACK = 'AGENT_COMMAND_ACK',
  AGENT_COMMAND_DISPATCH = 'AGENT_COMMAND_DISPATCH',
}

export interface WsMessage<T = unknown> {
  type: string;
  timestamp: string;
  payload: T;
}

// Policy Evaluation State
export interface PolicyEvaluationResult {
  deviceId: string;
  macAddress: string;
  isManaged: boolean;
  shouldBeRestricted: boolean;
  activeScheduleId?: string;
  activeScheduleName?: string;
  reason: string;
  isOverrideActive: boolean;
}
