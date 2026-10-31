import { describe, it, expect } from 'vitest';
import { PolicyEngine, DeviceWithSchedules } from '../../packages/scheduler/src/policyEngine';
import { RestrictionStatus, ScheduleOverrideAction } from '../../packages/shared/src/types';

describe('Restriction Policy Engine', () => {
  it('never restricts unmanaged devices regardless of schedules', () => {
    const unmanagedDevice: DeviceWithSchedules = {
      id: 'dev-1',
      macAddress: 'AA:BB:CC:DD:EE:01',
      isManaged: false,
      restrictionStatus: RestrictionStatus.NOT_MANAGED,
      scheduleDevices: [
        {
          schedule: {
            id: 'sched-1',
            name: 'Bedtime',
            startTime: '00:00',
            endTime: '23:59',
            daysOfWeek: '["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]',
            timezone: 'UTC',
            isEnabled: true,
            isPaused: false,
            activeOverride: 'NONE',
          },
        },
      ],
    };

    const result = PolicyEngine.evaluateDevice(unmanagedDevice, new Date());
    expect(result.shouldBeRestricted).toBe(false);
    expect(result.reason).toContain('OFF');
  });

  it('restricts managed device when current time matches active schedule', () => {
    const testDate = new Date('2026-10-26T23:30:00Z'); // Monday 11:30 PM

    const managedDevice: DeviceWithSchedules = {
      id: 'dev-2',
      macAddress: 'AA:BB:CC:DD:EE:02',
      isManaged: true,
      restrictionStatus: RestrictionStatus.SCHEDULED,
      scheduleDevices: [
        {
          schedule: {
            id: 'sched-1',
            name: 'Sleep Time',
            startTime: '22:00',
            endTime: '07:00',
            daysOfWeek: '["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]',
            timezone: 'UTC',
            isEnabled: true,
            isPaused: false,
            activeOverride: 'NONE',
          },
        },
      ],
    };

    const result = PolicyEngine.evaluateDevice(managedDevice, testDate);
    expect(result.shouldBeRestricted).toBe(true);
    expect(result.activeScheduleName).toBe('Sleep Time');
  });

  it('honors RESTRICT_NOW and RESTORE_NOW manual overrides immediately', () => {
    const deviceWithOverride: DeviceWithSchedules = {
      id: 'dev-3',
      macAddress: 'AA:BB:CC:DD:EE:03',
      isManaged: true,
      restrictionStatus: RestrictionStatus.SCHEDULED,
      scheduleDevices: [
        {
          schedule: {
            id: 'sched-1',
            name: 'Study Time',
            startTime: '10:00',
            endTime: '12:00',
            daysOfWeek: '["MONDAY"]',
            timezone: 'UTC',
            isEnabled: true,
            isPaused: false,
            activeOverride: ScheduleOverrideAction.RESTRICT_NOW,
          },
        },
      ],
    };

    // Even outside time window (e.g. 15:00), manual override forces restriction
    const result = PolicyEngine.evaluateDevice(deviceWithOverride, new Date('2026-10-26T15:00:00Z'));
    expect(result.shouldBeRestricted).toBe(true);
    expect(result.isOverrideActive).toBe(true);
  });
});
