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
import { Button } from "@/components/ui/button";
import { ScheduleFields } from "./ScheduleFields";
import { useTopicValidation } from "@/lib/hooks/useTopicValidation";
import { buildCronExpression, parseCronExpression } from "@/lib/cronUtils";
import type { UpdatePressReviewCmd, PressReviewDTO } from "@/types";

interface PressReviewFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdatePressReviewCmd) => Promise<void>;
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
  const { isValidating, validationResult, validateTopic } = useTopicValidation();

  // Calculate default values synchronously
  let defaultValues: FormValues = {
    topic: initialData?.topic || "",
    schedule: "daily",
    dayOfWeek: "",
    dayOfMonth: "",
    time: "9",
  };

  if (initialData?.schedule) {
    const parsed = parseCronExpression(initialData.schedule);
    if (parsed) {
      defaultValues = {
        ...defaultValues,
        schedule: parsed.schedule,
        dayOfWeek: parsed.dayOfWeek || "",
        dayOfMonth: parsed.dayOfMonth || "",
        time: parsed.time,
      };
    }
  }

  const form = useForm<FormValues>({
    defaultValues,
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
      <DialogContent className="max-w-md sm:max-w-lg" data-testid="press-review-form-dialog">
        <DialogHeader>
          <DialogTitle>Edit press review</DialogTitle>
          <DialogDescription>Update the topic or schedule of the press review.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              rules={{
                required: "Topic is required",
                minLength: {
                  value: 3,
                  message: "Topic must have at least 3 characters",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono font-bold uppercase text-sm">Press review topic</FormLabel>
                  <div className="brutalist-input-wrapper">
                    <FormControl>
                      <Input
                        placeholder="e.g. Artificial intelligence"
                        {...field}
                        aria-invalid={isTopicInvalid}
                        data-testid="topic-input"
                        className="brutalist-input"
                      />
                    </FormControl>
                  </div>
                  <FormDescription className="font-mono text-xs">
                    {isValidating && "Checking topic..."}
                    {!isValidating && validationResult && validationResult.is_valid && "✓ Topic looks good!"}
                  </FormDescription>
                  <FormMessage />
                  {isTopicInvalid && validationResult.suggestions.length > 0 && (
                    <div className="text-sm text-destructive space-y-1 font-mono">
                      <p className="font-bold">Suggestions:</p>
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

            <ScheduleFields control={form.control} scheduleValue={scheduleValue} />

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="brutalist-outline"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
                data-testid="cancel-button"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                variant="brutalist"
                disabled={!canSubmit}
                className="w-full sm:w-auto"
                data-testid="submit-button"
              >
                {form.formState.isSubmitting ? "SAVING..." : "SAVE CHANGES"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
