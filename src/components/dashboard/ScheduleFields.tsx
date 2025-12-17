import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Control, FieldValues, Path } from "react-hook-form";

interface ScheduleFieldsProps<T extends FieldValues> {
  control: Control<T>;
  scheduleValue: string;
}

export function ScheduleFields<T extends FieldValues>({ control, scheduleValue }: ScheduleFieldsProps<T>) {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 w-full">
        <FormField
          control={control}
          name={"schedule" as Path<T>}
          rules={{ required: "Schedule is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="bg-white">
                  <SelectTrigger data-testid="schedule-select-trigger">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white">
                  <SelectItem value="daily" data-testid="schedule-select-option-daily">
                    Daily
                  </SelectItem>
                  <SelectItem value="weekly" data-testid="schedule-select-option-weekly">
                    Weekly
                  </SelectItem>
                  <SelectItem value="monthly" data-testid="schedule-select-option-monthly">
                    Monthly
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {scheduleValue === "weekly" && (
        <div className="flex-1">
          <FormField
            control={control}
            name={"dayOfWeek" as Path<T>}
            rules={{
              required: scheduleValue === "weekly" ? "Day of week is required" : false,
            }}
            render={({ field }) => (
              <FormItem className="bg-white">
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger data-testid="day-of-week-select-trigger">
                    <SelectValue placeholder="Select day of week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {scheduleValue === "monthly" && (
        <div className="flex-1">
          <FormField
            control={control}
            name={"dayOfMonth" as Path<T>}
            rules={{
              required: scheduleValue === "monthly" ? "Day of month is required" : false,
            }}
            render={({ field }) => (
              <FormItem className="bg-white">
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger data-testid="day-of-month-select-trigger">
                    <SelectValue placeholder="Select day of month" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto bg-white">
                    {Array.from({ length: 31 }, (_, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="flex-1">
        <FormField
          control={control}
          name={"time" as Path<T>}
          rules={{
            required: "Time is required",
          }}
          render={({ field }) => (
            <FormItem className="bg-white">
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger data-testid="time-select-trigger">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {Array.from({ length: 24 }, (_, index) => {
                    const hour = String(index).padStart(2, "0");

                    return (
                      <SelectItem key={index} value={index.toString()}>
                        {`${hour}:00`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
