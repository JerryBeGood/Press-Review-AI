import { useState, useEffect, useCallback } from "react";
import type { QuotaInfoDTO } from "@/types";

interface QuotaInfo {
  scheduledCount: number;
  scheduledLimit: number;
  generatedCount: number;
  generatedLimit: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch quota information from user profile
 * @returns Quota information including counts and limits for both scheduled and generated reviews
 */
export function useGenerationQuota(): QuotaInfo {
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfoDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuotaInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/quota");

      if (!response.ok) {
        throw new Error(`Failed to fetch quota information: ${response.statusText}`);
      }

      const data: QuotaInfoDTO = await response.json();
      setQuotaInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotaInfo();
  }, [fetchQuotaInfo]);

  return {
    scheduledCount: quotaInfo?.scheduled_count ?? 0,
    scheduledLimit: quotaInfo?.scheduled_limit ?? 5,
    generatedCount: quotaInfo?.generated_count ?? 0,
    generatedLimit: quotaInfo?.generated_limit ?? 5,
    isLoading,
    error,
    refetch: fetchQuotaInfo,
  };
}
