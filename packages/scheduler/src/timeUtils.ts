import { DayOfWeek } from '@nightguard/shared';

const DAY_NAMES: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

/**
 * Converts a "HH:mm" 24-hr time string into total minutes from midnight (0 - 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Returns the current time components in the target timezone.
 */
export function getZonedTimeComponents(date: Date, timeZone: string): {
  dayOfWeek: DayOfWeek;
  minutesFromMidnight: number;
  timeString: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  let weekdayStr = '';
  let hourStr = '00';
  let minuteStr = '00';

  for (const part of parts) {
    if (part.type === 'weekday') weekdayStr = part.value.toUpperCase();
    if (part.type === 'hour') hourStr = part.value;
    if (part.type === 'minute') minuteStr = part.value;
  }

  // Handle midnight 24 edge case from some formatters
  if (hourStr === '24') hourStr = '00';

  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  const minutesFromMidnight = hours * 60 + minutes;

  const dayOfWeek = (DayOfWeek as any)[weekdayStr] || DayOfWeek.MONDAY;

  return {
    dayOfWeek,
    minutesFromMidnight,
    timeString: `${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}`,
  };
}

/**
 * Evaluates whether a given time falls within a schedule's active restriction window.
 * Properly accounts for windows that cross midnight (e.g. 22:00 to 07:00).
 */
export function isScheduleCurrentlyActive(
  startTime: string,
  endTime: string,
  selectedDays: DayOfWeek[],
  targetTime: Date,
  timeZone: string
): boolean {
  const { dayOfWeek, minutesFromMidnight } = getZonedTimeComponents(targetTime, timeZone);
  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);

  const crossesMidnight = startMins > endMins;

  if (!crossesMidnight) {
    // Window is within the same calendar day (e.g. 13:00 to 17:00)
    const isInTimeRange = minutesFromMidnight >= startMins && minutesFromMidnight < endMins;
    const isSelectedDay = selectedDays.includes(dayOfWeek);
    return isInTimeRange && isSelectedDay;
  }

  // Schedule crosses midnight (e.g. 22:00 to 07:00)
  if (minutesFromMidnight >= startMins) {
    // We are on the start-day evening (e.g. 23:00)
    return selectedDays.includes(dayOfWeek);
  } else if (minutesFromMidnight < endMins) {
    // We are on the morning after midnight (e.g. 02:00)
    // The schedule originated on the previous day of week!
    const currentDayIdx = DAY_NAMES.indexOf(dayOfWeek);
    const previousDayIdx = (currentDayIdx - 1 + 7) % 7;
    const previousDay = DAY_NAMES[previousDayIdx];
    return selectedDays.includes(previousDay);
  }

  return false;
}

/**
 * Calculates the next upcoming transition (either NEXT_RESTRICT or NEXT_RESTORE)
 */
export function getNextScheduleEvent(
  startTime: string,
  endTime: string,
  selectedDays: DayOfWeek[],
  targetTime: Date,
  timeZone: string
): { event: 'RESTRICT' | 'RESTORE'; transitionDate: Date } {
  const isActiveNow = isScheduleCurrentlyActive(startTime, endTime, selectedDays, targetTime, timeZone);
  const endMins = parseTimeToMinutes(endTime);
  const startMins = parseTimeToMinutes(startTime);

  // Approximate next transition timestamp
  const transitionDate = new Date(targetTime.getTime() + 60 * 60 * 1000);
  return {
    event: isActiveNow ? 'RESTORE' : 'RESTRICT',
    transitionDate,
  };
}
