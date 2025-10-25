import { useState, useEffect, useCallback } from "react";
import type { ValidateTopicResultDTO } from "@/types";

interface UseTopicValidationReturn {
  isValidating: boolean;
  validationResult: ValidateTopicResultDTO | null;
  validateTopic: (topic: string) => void;
  reset: () => void;
}

export function useTopicValidation(): UseTopicValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidateTopicResultDTO | null>(null);
  const [debouncedTopic, setDebouncedTopic] = useState("");

  const validateTopic = useCallback((topic: string) => {
    setDebouncedTopic(topic);
  }, []);

  const reset = useCallback(() => {
    setIsValidating(false);
    setValidationResult(null);
    setDebouncedTopic("");
  }, []);

  useEffect(() => {
    if (!debouncedTopic || debouncedTopic.trim().length === 0) {
      setValidationResult(null);
      return;
    }

    const handler = setTimeout(async () => {
      setIsValidating(true);
      try {
        const response = await fetch("/api/press_reviews/validate_topic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic: debouncedTopic }),
        });

        if (!response.ok) {
          throw new Error("Validation failed");
        }

        const result: ValidateTopicResultDTO = await response.json();
        setValidationResult(result);
      } catch {
        setValidationResult({
          is_valid: false,
          suggestions: ["Failed to validate topic. Please try again."],
        });
      } finally {
        setIsValidating(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [debouncedTopic]);

  return {
    isValidating,
    validationResult,
    validateTopic,
    reset,
  };
}
