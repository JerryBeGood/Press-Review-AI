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

export function formatCronToReadable(cronString: string): string {
  const config = parseCronExpression(cronString);

  if (!config) {
    return cronString; // Fallback to original string if unparseable
  }

  const formatTime = (time: string): string => {
    const hour = parseInt(time, 10);
    if (hour === 0) return "12:00 AM";
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return "12:00 PM";
    return `${hour - 12}:00 PM`;
  };

  const timeStr = formatTime(config.time);

  switch (config.schedule) {
    case "daily":
      return `Daily at ${timeStr}`;

    case "weekly": {
      const dayName = config.dayOfWeek ? config.dayOfWeek.charAt(0).toUpperCase() + config.dayOfWeek.slice(1) : "";
      return `Every ${dayName} at ${timeStr}`;
    }

    case "monthly": {
      const day = config.dayOfMonth;
      const suffix =
        day === "1" || day === "21" || day === "31"
          ? "st"
          : day === "2" || day === "22"
            ? "nd"
            : day === "3" || day === "23"
              ? "rd"
              : "th";
      return `Monthly on the ${day}${suffix} at ${timeStr}`;
    }

    default:
      return cronString;
  }
}
