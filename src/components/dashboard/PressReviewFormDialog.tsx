import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTopicValidation } from "@/lib/hooks/useTopicValidation";
import { buildCronExpression, parseCronExpression } from "@/lib/cronUtils";
import type { CreatePressReviewCmd, UpdatePressReviewCmd, PressReviewDTO } from "@/types";

interface PressReviewFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePressReviewCmd | UpdatePressReviewCmd) => Promise<void>;
  initialData?: PressReviewDTO;
}

interface FormValues {
  topic: string;
  schedule: string;
  dayOfWeek: string;
  dayOfMonth: string;
  time: string;
}

export function PressReviewFormDialog({ isOpen, onClose, onSubmit, initialData }: PressReviewFormDialogProps) {
  const isEditMode = !!initialData;
  const { isValidating, validationResult, validateTopic, reset } = useTopicValidation();

  const form = useForm<FormValues>({
    defaultValues: {
      topic: initialData?.topic || "",
      schedule: "daily",
      dayOfWeek: "",
      dayOfMonth: "",
      time: "9",
    },
  });

  const scheduleValue = form.watch("schedule");
  const topicValue = form.watch("topic");
  const dayOfWeekValue = form.watch("dayOfWeek");
  const dayOfMonthValue = form.watch("dayOfMonth");

  // Validate topic on change (with debounce in hook)
  useEffect(() => {
    if (topicValue && topicValue.trim().length > 0) {
      validateTopic(topicValue);
    }
  }, [topicValue, validateTopic]);

  // Reset form when dialog closes or opens with new data
  useEffect(() => {
    if (isOpen) {
      let scheduleConfig: {
        schedule: "daily" | "weekly" | "monthly";
        dayOfWeek: string;
        dayOfMonth: string;
        time: string;
      } = {
        schedule: "daily",
        dayOfWeek: "",
        dayOfMonth: "",
        time: "9",
      };

      // Parse CRON expression if editing existing review
      if (initialData?.schedule) {
        const parsed = parseCronExpression(initialData.schedule);
        if (parsed) {
          scheduleConfig = {
            schedule: parsed.schedule,
            dayOfWeek: parsed.dayOfWeek || "",
            dayOfMonth: parsed.dayOfMonth || "",
            time: parsed.time,
          };
        }
      }

      form.reset({
        topic: initialData?.topic || "",
        ...scheduleConfig,
      });
      reset();
    }
  }, [isOpen, initialData, form, reset]);

  const handleSubmit = async (values: FormValues) => {
    try {
      // Build CRON expression from form values
      const cronExpression = buildCronExpression({
        schedule: values.schedule as "daily" | "weekly" | "monthly",
        time: values.time,
        dayOfWeek: values.dayOfWeek
          ? (values.dayOfWeek as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")
          : undefined,
        dayOfMonth: values.dayOfMonth || undefined,
      });

      // Construct payload with topic and CRON schedule
      const payload = {
        topic: values.topic,
        schedule: cronExpression,
      };

      await onSubmit(payload);
      onClose();
      form.reset();
    } catch {
      // Handle error (will be shown by parent component via toast)
    }
  };

  const isTopicInvalid = validationResult !== null && !validationResult.is_valid;

  const isScheduleValid =
    scheduleValue === "daily" ||
    (scheduleValue === "weekly" && dayOfWeekValue && dayOfWeekValue.trim().length > 0) ||
    (scheduleValue === "monthly" && dayOfMonthValue && dayOfMonthValue.trim().length > 0);

  const canSubmit =
    !isValidating && topicValue.trim().length > 0 && !isTopicInvalid && isScheduleValid && !form.formState.isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edytuj prasówkę" : "Utwórz nową prasówkę"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Zaktualizuj temat lub harmonogram prasówki."
              : "Zdefiniuj temat i harmonogram dla swojej nowej prasówki."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              rules={{
                required: "Temat jest wymagany",
                minLength: {
                  value: 3,
                  message: "Temat musi mieć co najmniej 3 znaki",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temat prasówki</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Sztuczna inteligencja" {...field} aria-invalid={isTopicInvalid} />
                  </FormControl>
                  <FormDescription>
                    {isValidating && "Sprawdzanie tematu..."}
                    {!isValidating && validationResult && validationResult.is_valid && "Temat wygląda dobrze!"}
                  </FormDescription>
                  <FormMessage />
                  {isTopicInvalid && validationResult.suggestions.length > 0 && (
                    <div className="text-sm text-destructive space-y-1">
                      <p className="font-medium">Sugestie:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </FormItem>
              )}
            />

            <div className="flex w-full items-end gap-4">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="schedule"
                  rules={{ required: "Harmonogram jest wymagany" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harmonogram</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz harmonogram" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
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
                    control={form.control}
                    name="dayOfWeek"
                    rules={{
                      required: scheduleValue === "weekly" ? "Dzień tygodnia jest wymagany" : false,
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz dzień tygodnia" />
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
                    control={form.control}
                    name="dayOfMonth"
                    rules={{
                      required: scheduleValue === "monthly" ? "Dzień miesiąca jest wymagany" : false,
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz dzień miesiąca" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
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
                  control={form.control}
                  name="time"
                  rules={{
                    required: "Godzina jest wymagana",
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz godzinę" />
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                {form.formState.isSubmitting ? "Zapisywanie..." : isEditMode ? "Zapisz zmiany" : "Utwórz prasówkę"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
