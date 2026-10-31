import {
  RestrictionStatus,
  DayOfWeek,
  ScheduleOverrideAction,
  PolicyEvaluationResult,
} from '@nightguard/shared';
import { isScheduleCurrentlyActive } from './timeUtils';

export interface DeviceWithSchedules {
  id: string;
  macAddress: string;
  isManaged: boolean;
  restrictionStatus: string;
  router?: {
    id: string;
    connectionStatus: string;
  } | null;
  scheduleDevices: Array<{
    schedule: {
      id: string;
      name: string;
      startTime: string;
      endTime: string;
      daysOfWeek: string;
      timezone: string;
      isEnabled: boolean;
      isPaused: boolean;
      activeOverride: string;
    };
  }>;
}

export class PolicyEngine {
  /**
   * Evaluates the current intended restriction policy for a device at a specific point in time.
   */
  public static evaluateDevice(device: DeviceWithSchedules, currentTime = new Date()): PolicyEvaluationResult {
    // 1. If device is not managed, it is never restricted
    if (!device.isManaged) {
      return {
        deviceId: device.id,
        macAddress: device.macAddress,
        isManaged: false,
        shouldBeRestricted: false,
        reason: 'Device management toggle is OFF',
        isOverrideActive: false,
      };
    }

    // 2. Check each assigned schedule
    for (const item of device.scheduleDevices) {
      const schedule = item.schedule;

      // Check manual override first
      if (schedule.activeOverride === ScheduleOverrideAction.RESTRICT_NOW) {
        return {
          deviceId: device.id,
          macAddress: device.macAddress,
          isManaged: true,
          shouldBeRestricted: true,
          activeScheduleId: schedule.id,
          activeScheduleName: schedule.name,
          reason: 'Manual override: RESTRICT_NOW active',
          isOverrideActive: true,
        };
      }

      if (schedule.activeOverride === ScheduleOverrideAction.RESTORE_NOW) {
        return {
          deviceId: device.id,
          macAddress: device.macAddress,
          isManaged: true,
          shouldBeRestricted: false,
          activeScheduleId: schedule.id,
          activeScheduleName: schedule.name,
          reason: 'Manual override: RESTORE_NOW active',
          isOverrideActive: true,
        };
      }

      // If schedule is disabled or paused, skip
      if (!schedule.isEnabled || schedule.isPaused) {
        continue;
      }

      // Parse days
      let days: DayOfWeek[] = [];
      try {
        days = JSON.parse(schedule.daysOfWeek);
      } catch {
        days = [
          DayOfWeek.MONDAY,
          DayOfWeek.TUESDAY,
          DayOfWeek.WEDNESDAY,
          DayOfWeek.THURSDAY,
          DayOfWeek.FRIDAY,
          DayOfWeek.SATURDAY,
          DayOfWeek.SUNDAY,
        ];
      }

      // Evaluate time window
      const isActive = isScheduleCurrentlyActive(
        schedule.startTime,
        schedule.endTime,
        days,
        currentTime,
        schedule.timezone || 'UTC'
      );

      if (isActive) {
        return {
          deviceId: device.id,
          macAddress: device.macAddress,
          isManaged: true,
          shouldBeRestricted: true,
          activeScheduleId: schedule.id,
          activeScheduleName: schedule.name,
          reason: `Active schedule window: ${schedule.name} (${schedule.startTime} - ${schedule.endTime})`,
          isOverrideActive: false,
        };
      }
    }

    // Default when managed but no active schedule window
    return {
      deviceId: device.id,
      macAddress: device.macAddress,
      isManaged: true,
      shouldBeRestricted: false,
      reason: 'No active schedule window at current time',
      isOverrideActive: false,
    };
  }

  /**
   * Computes the new device status based on router health and command outcome.
   */
  public static resolveEnforcementState(
    isManaged: boolean,
    isRouterOnline: boolean,
    shouldBeRestricted: boolean,
    commandSuccess: boolean | null,
    pending: boolean = false
  ): RestrictionStatus {
    if (!isManaged) {
      return RestrictionStatus.NOT_MANAGED;
    }

    if (!isRouterOnline) {
      return RestrictionStatus.ROUTER_OFFLINE;
    }

    if (pending) {
      return shouldBeRestricted ? RestrictionStatus.PENDING : RestrictionStatus.RESTORATION_PENDING;
    }

    if (commandSuccess === false) {
      return RestrictionStatus.FAILED;
    }

    if (shouldBeRestricted) {
      return commandSuccess ? RestrictionStatus.RESTRICTION_ACTIVE : RestrictionStatus.FAILED;
    }

    return RestrictionStatus.SCHEDULED;
  }
}
