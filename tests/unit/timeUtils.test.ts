import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  isScheduleCurrentlyActive,
} from '../../packages/scheduler/src/timeUtils';
import { DayOfWeek } from '../../packages/shared/src/types';

describe('Scheduling Time Engine', () => {
  it('correctly converts 24h time strings to minutes', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
    expect(parseTimeToMinutes('01:30')).toBe(90);
    expect(parseTimeToMinutes('10:00')).toBe(600);
    expect(parseTimeToMinutes('22:00')).toBe(1320);
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });

  it('correctly evaluates standard same-day schedule (14:00 to 18:00)', () => {
    const days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY];

    // Inside window: Monday 15:30 UTC
    const insideDate = new Date('2026-10-26T15:30:00Z'); // 2026-10-26 is Monday
    expect(isScheduleCurrentlyActive('14:00', '18:00', days, insideDate, 'UTC')).toBe(true);

    // Outside window: Monday 19:00 UTC
    const outsideDate = new Date('2026-10-26T19:00:00Z');
    expect(isScheduleCurrentlyActive('14:00', '18:00', days, outsideDate, 'UTC')).toBe(false);

    // Right day, but unselected day: Wednesday 15:30 UTC
    const wedDate = new Date('2026-10-28T15:30:00Z');
    expect(isScheduleCurrentlyActive('14:00', '18:00', days, wedDate, 'UTC')).toBe(false);
  });

  it('correctly evaluates schedules that cross midnight (22:00 to 07:00)', () => {
    // Active on Monday night through Sunday night
    const allDays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
      DayOfWeek.SUNDAY,
    ];

    // At 23:00 (11 PM) on Monday evening -> Should be ACTIVE
    const nightDate = new Date('2026-10-26T23:00:00Z');
    expect(isScheduleCurrentlyActive('22:00', '07:00', allDays, nightDate, 'UTC')).toBe(true);

    // At 03:00 (3 AM) on Tuesday morning -> Should be ACTIVE (spans from Monday night)
    const earlyMorningDate = new Date('2026-10-27T03:00:00Z');
    expect(isScheduleCurrentlyActive('22:00', '07:00', allDays, earlyMorningDate, 'UTC')).toBe(true);

    // At 07:01 (7:01 AM) on Tuesday morning -> Should be RESTORED (inactive)
    const afterRestoreDate = new Date('2026-10-27T07:01:00Z');
    expect(isScheduleCurrentlyActive('22:00', '07:00', allDays, afterRestoreDate, 'UTC')).toBe(false);

    // At 14:00 (2 PM) afternoon -> Should be RESTORED (inactive)
    const afternoonDate = new Date('2026-10-27T14:00:00Z');
    expect(isScheduleCurrentlyActive('22:00', '07:00', allDays, afternoonDate, 'UTC')).toBe(false);
  });
});
