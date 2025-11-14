import { describe, it, expect } from "vitest";
import { buildCronExpression, parseCronExpression, formatCronToReadable, type ScheduleConfig } from "@/lib/cronUtils";

describe("cronUtils", () => {
  describe("buildCronExpression", () => {
    it("should build a daily cron expression", () => {
      const config: ScheduleConfig = { schedule: "daily", time: "14" };
      expect(buildCronExpression(config)).toBe("0 14 * * *");
    });

    it("should build a weekly cron expression", () => {
      const config: ScheduleConfig = { schedule: "weekly", time: "9", dayOfWeek: "monday" };
      expect(buildCronExpression(config)).toBe("0 9 * * 1");
    });

    it("should build a monthly cron expression", () => {
      const config: ScheduleConfig = { schedule: "monthly", time: "23", dayOfMonth: "15" };
      expect(buildCronExpression(config)).toBe("0 23 15 * *");
    });

    it("should throw error for weekly schedule without dayOfWeek", () => {
      const config: ScheduleConfig = { schedule: "weekly", time: "9" };
      expect(() => buildCronExpression(config)).toThrow("dayOfWeek is required for weekly schedule");
    });

    it("should throw error for monthly schedule without dayOfMonth", () => {
      const config: ScheduleConfig = { schedule: "monthly", time: "23" };
      expect(() => buildCronExpression(config)).toThrow("dayOfMonth is required for monthly schedule");
    });
  });

  describe("parseCronExpression", () => {
    it("should parse a daily cron expression", () => {
      const cron = "0 8 * * *";
      const expected: ScheduleConfig = { schedule: "daily", time: "8" };
      expect(parseCronExpression(cron)).toEqual(expected);
    });

    it("should parse a weekly cron expression", () => {
      const cron = "0 17 * * 5";
      const expected: ScheduleConfig = { schedule: "weekly", time: "17", dayOfWeek: "friday" };
      expect(parseCronExpression(cron)).toEqual(expected);
    });

    it("should parse a monthly cron expression", () => {
      const cron = "0 7 21 * *";
      const expected: ScheduleConfig = { schedule: "monthly", time: "7", dayOfMonth: "21" };
      expect(parseCronExpression(cron)).toEqual(expected);
    });

    it("should return null for invalid or unsupported cron strings", () => {
      expect(parseCronExpression("*/5 * * * *")).toBeNull();
      expect(parseCronExpression("not a cron string")).toBeNull();
      expect(parseCronExpression("0 8 15 1 *")).toBeNull();
      expect(parseCronExpression("")).toBeNull();
    });
  });

  describe("formatCronToReadable", () => {
    it("should format a daily cron string correctly (AM)", () => {
      const cron = "0 9 * * *";
      expect(formatCronToReadable(cron)).toBe("Daily at 9:00 AM");
    });

    it("should format a daily cron string correctly (PM)", () => {
      const cron = "0 22 * * *";
      expect(formatCronToReadable(cron)).toBe("Daily at 10:00 PM");
    });

    it("should format a daily cron string correctly (Midnight)", () => {
      const cron = "0 0 * * *";
      expect(formatCronToReadable(cron)).toBe("Daily at 12:00 AM");
    });

    it("should format a daily cron string correctly (Noon)", () => {
      const cron = "0 12 * * *";
      expect(formatCronToReadable(cron)).toBe("Daily at 12:00 PM");
    });

    it("should format a weekly cron string correctly", () => {
      const cron = "0 16 * * 3";
      expect(formatCronToReadable(cron)).toBe("Every Wednesday at 4:00 PM");
    });

    it("should format a monthly cron string with 'st' suffix", () => {
      const cron = "0 10 1 * *";
      expect(formatCronToReadable(cron)).toBe("Monthly on the 1st at 10:00 AM");
    });

    it("should format a monthly cron string with 'nd' suffix", () => {
      const cron = "0 11 2 * *";
      expect(formatCronToReadable(cron)).toBe("Monthly on the 2nd at 11:00 AM");
    });

    it("should format a monthly cron string with 'rd' suffix", () => {
      const cron = "0 12 3 * *";
      expect(formatCronToReadable(cron)).toBe("Monthly on the 3rd at 12:00 PM");
    });

    it("should format a monthly cron string with 'th' suffix", () => {
      const cron = "0 13 4 * *";
      expect(formatCronToReadable(cron)).toBe("Monthly on the 4th at 1:00 PM");
    });

    it("should return the original string for unparseable cron expressions", () => {
      const cron = "5 * * * *";
      expect(formatCronToReadable(cron)).toBe(cron);
    });
  });
});
