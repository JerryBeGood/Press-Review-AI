import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/schemas/auth.schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ChangePasswordResponse } from "@/types/api";

/**
 * ChangePasswordForm component
 * Allows users to change their password after verifying the current one
 */
export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: ChangePasswordInput) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 401) {
          toast.error("Current password is incorrect");
          form.setFocus("currentPassword");
          return;
        }

        if (response.status === 400 && data.errors) {
          // Handle validation errors
          Object.entries(data.errors).forEach(([field, messages]) => {
            form.setError(field as keyof ChangePasswordInput, {
              message: (messages as string[])[0],
            });
          });
          return;
        }

        throw new Error(data.message || "Failed to update password");
      }

      const result: ChangePasswordResponse = await response.json();
      toast.success(result.message);
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="brutalist-box-interactive p-6 bg-[var(--background)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-1">
        <h3 className="text-xl font-bold font-mono uppercase tracking-tight">CHANGE PASSWORD</h3>
        <p className="text-sm font-mono mt-1 mb-2 text-gray-600">
          Update your password. You&apos;ll need to enter your current password first.
        </p>
      </div>

      <div
        className={`transition-all duration-700 ease-in-out overflow-hidden ${
          isHovered ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isHovered}
      >
        <div className="p-4 -m-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono font-bold uppercase text-sm">Current Password</FormLabel>
                    <FormControl>
                      <div className="brutalist-input-wrapper">
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="brutalist-input"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-mono text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono font-bold uppercase text-sm">New Password</FormLabel>
                    <FormControl>
                      <div className="brutalist-input-wrapper">
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="brutalist-input"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-mono text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono font-bold uppercase text-sm">Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="brutalist-input-wrapper">
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="brutalist-input"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-mono text-sm" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button type="submit" disabled={isSubmitting} variant="brutalist" className="w-full h-auto py-3">
                  {isSubmitting ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
