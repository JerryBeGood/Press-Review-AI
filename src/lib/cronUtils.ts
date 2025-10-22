export interface ScheduleConfig {
  schedule: "daily" | "weekly" | "monthly";
  time: string; // "0"-"23"
  dayOfWeek?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  dayOfMonth?: string; // "1"-"31"
}

const DAY_OF_WEEK_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DAY_OF_WEEK_REVERSE_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export function buildCronExpression(config: ScheduleConfig): string {
  const { schedule, time } = config;
  const minute = "0"; // Always at the top of the hour
  const hour = time;

  switch (schedule) {
    case "daily":
      return `${minute} ${hour} * * *`;

    case "weekly": {
      if (!config.dayOfWeek) {
        throw new Error("dayOfWeek is required for weekly schedule");
      }
      const dayOfWeekNumber = DAY_OF_WEEK_MAP[config.dayOfWeek];
      return `${minute} ${hour} * * ${dayOfWeekNumber}`;
    }

    case "monthly": {
      if (!config.dayOfMonth) {
        throw new Error("dayOfMonth is required for monthly schedule");
      }
      return `${minute} ${hour} ${config.dayOfMonth} * *`;
    }

    default:
      throw new Error(`Unsupported schedule type: ${schedule}`);
  }
}

export function parseCronExpression(cronString: string): ScheduleConfig | null {
  if (!cronString || typeof cronString !== "string") {
    return null;
  }

  const parts = cronString.trim().split(/\s+/);

  if (parts.length !== 5) {
    return null;
  }

  // Daily pattern: "0 H * * *"
  const dailyPattern = /^0 (\d{1,2}) \* \* \*$/;
  const dailyMatch = cronString.match(dailyPattern);
  if (dailyMatch) {
    return {
      schedule: "daily",
      time: dailyMatch[1],
    };
  }

  // Weekly pattern: "0 H * * D" where D is 0-6
  const weeklyPattern = /^0 (\d{1,2}) \* \* ([0-6])$/;
  const weeklyMatch = cronString.match(weeklyPattern);
  if (weeklyMatch) {
    const dayNumber = parseInt(weeklyMatch[2], 10);
    const dayName = DAY_OF_WEEK_REVERSE_MAP[dayNumber];
    return {
      schedule: "weekly",
      time: weeklyMatch[1],
      dayOfWeek: dayName as ScheduleConfig["dayOfWeek"],
    };
  }

  // Monthly pattern: "0 H D * *" where D is 1-31
  const monthlyPattern = /^0 (\d{1,2}) (\d{1,2}) \* \*$/;
  const monthlyMatch = cronString.match(monthlyPattern);
  if (monthlyMatch) {
    return {
      schedule: "monthly",
      time: monthlyMatch[1],
      dayOfMonth: monthlyMatch[2],
    };
  }

  return null;
}
