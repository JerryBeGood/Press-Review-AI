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
}

export function PressReviewFormDialog({ isOpen, onClose, onSubmit, initialData }: PressReviewFormDialogProps) {
  const isEditMode = !!initialData;
  const { isValidating, validationResult, validateTopic, reset } = useTopicValidation();

  const form = useForm<FormValues>({
    defaultValues: {
      topic: initialData?.topic || "",
      schedule: initialData?.schedule || "daily at 08:00",
    },
  });

  const topicValue = form.watch("topic");

  // Validate topic on change (with debounce in hook)
  useEffect(() => {
    if (topicValue && topicValue.trim().length > 0) {
      validateTopic(topicValue);
    }
  }, [topicValue, validateTopic]);

  // Reset form when dialog closes or opens with new data
  useEffect(() => {
    if (isOpen) {
      form.reset({
        topic: initialData?.topic || "",
        schedule: initialData?.schedule || "daily at 08:00",
      });
      reset();
    }
  }, [isOpen, initialData, form, reset]);

  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values);
      onClose();
      form.reset();
    } catch {
      // Handle error (will be shown by parent component via toast)
    }
  };

  const isTopicInvalid = validationResult !== null && !validationResult.is_valid;
  const canSubmit = !isValidating && topicValue.trim().length > 0 && !isTopicInvalid && !form.formState.isSubmitting;

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
                      <SelectItem value="daily at 08:00">Codziennie o 8:00</SelectItem>
                      <SelectItem value="daily at 12:00">Codziennie o 12:00</SelectItem>
                      <SelectItem value="daily at 18:00">Codziennie o 18:00</SelectItem>
                      <SelectItem value="weekly on Monday at 08:00">Co tydzień w poniedziałek o 8:00</SelectItem>
                      <SelectItem value="weekly on Friday at 17:00">Co tydzień w piątek o 17:00</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Wybierz, jak często chcesz otrzymywać prasówkę.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
