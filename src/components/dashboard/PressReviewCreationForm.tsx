import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScheduleFields } from "./ScheduleFields";
import { useTopicValidation } from "@/lib/hooks/useTopicValidation";
import { buildCronExpression } from "@/lib/cronUtils";
import type { CreatePressReviewCmd } from "@/types";

interface FormValues {
  topic: string;
  schedule: string;
  dayOfWeek: string;
  dayOfMonth: string;
  time: string;
}

interface PressReviewCreationFormProps {
  onSubmit: (data: CreatePressReviewCmd) => Promise<void>;
  isSubmitting: boolean;
  hasReachedLimit: boolean;
}

export function PressReviewCreationForm({ onSubmit, isSubmitting, hasReachedLimit }: PressReviewCreationFormProps) {
  const { isValidating, validationResult, validateTopic, reset: resetValidation } = useTopicValidation();
  const [isTopicFocused, setIsTopicFocused] = useState(false);
  const formContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      topic: "",
      schedule: "daily",
      dayOfWeek: "",
      dayOfMonth: "",
      time: "8",
    },
  });

  const scheduleValue = form.watch("schedule");
  const topicValue = form.watch("topic");
  const dayOfWeekValue = form.watch("dayOfWeek");
  const dayOfMonthValue = form.watch("dayOfMonth");

  // Show schedule fields if topic is focused OR has text
  const showScheduleFields = isTopicFocused || topicValue.trim().length > 0;

  // Handle click outside to reset form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside the form container
      if (formContainerRef.current && !formContainerRef.current.contains(target)) {
        // Check if click is not on a Select dropdown portal (Radix UI renders these outside the form)
        const isClickOnSelectContent =
          target.closest('[role="listbox"]') || target.closest("[data-radix-select-content]");

        if (!isClickOnSelectContent) {
          // Reset form to default state
          form.reset();
          setIsTopicFocused(false);
          resetValidation();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [form, resetValidation]);

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
      const payload: CreatePressReviewCmd = {
        topic: values.topic,
        schedule: cronExpression,
      };

      await onSubmit(payload);
      form.reset();
      resetValidation();
    } catch {
      // Error handling is done by parent component
    }
  };

  const isTopicInvalid = validationResult !== null && !validationResult.is_valid;

  const isScheduleValid =
    scheduleValue === "daily" ||
    (scheduleValue === "weekly" && dayOfWeekValue && dayOfWeekValue.trim().length > 0) ||
    (scheduleValue === "monthly" && dayOfMonthValue && dayOfMonthValue.trim().length > 0);

  const canSubmit =
    !isValidating &&
    topicValue.trim().length > 0 &&
    !isTopicInvalid &&
    isScheduleValid &&
    !isSubmitting &&
    !hasReachedLimit;

  return (
    <div ref={formContainerRef} className="brutalist-box-interactive p-4 sm:p-6 bg-[var(--bg-color)]">
      <h2 className="text-xl font-bold uppercase mb-4 tracking-tight">ADD NEW PRESS REVIEW</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Topic Input Section */}
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
                <div className="brutalist-input-wrapper">
                  <FormControl>
                    <Input
                      placeholder="e.g. Artificial Intelligence"
                      {...field}
                      onFocus={() => setIsTopicFocused(true)}
                      onBlur={() => setIsTopicFocused(false)}
                      aria-invalid={isTopicInvalid}
                      data-testid="creation-topic-input"
                      className="brutalist-input text-base"
                    />
                  </FormControl>
                </div>
                <FormDescription className="font-mono text-xs">
                  {topicValue.trim().length > 0 && isValidating && "Checking topic..."}
                  {topicValue.trim().length > 0 &&
                    !isValidating &&
                    validationResult &&
                    validationResult.is_valid &&
                    "✓ Topic looks good!"}
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

          {/* Schedule Fields Section - Only shown when topic is focused or has text */}
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showScheduleFields ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className={showScheduleFields ? "animate-smooth-bounce-in py-2" : "py-2"}>
              <ScheduleFields control={form.control} scheduleValue={scheduleValue} />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="brutalist"
              disabled={!canSubmit}
              className="w-full h-auto py-3"
              data-testid="creation-submit-button"
            >
              {isSubmitting ? "ADDING..." : "ADD REVIEW"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
