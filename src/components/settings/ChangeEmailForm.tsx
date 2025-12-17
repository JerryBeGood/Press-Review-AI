import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { changeEmailSchema, type ChangeEmailInput } from "@/lib/schemas/auth.schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ChangeEmailResponse } from "@/types/api";

interface ChangeEmailFormProps {
  currentEmail: string;
}

/**
 * ChangeEmailForm component
 * Allows users to change their email address
 * Sends verification email to the new address
 */
export function ChangeEmailForm({ currentEmail }: ChangeEmailFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const form = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  const handleSubmit = async (values: ChangeEmailInput) => {
    // Check if new email is different from current
    if (values.newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      form.setError("newEmail", {
        message: "New email must be different from current email",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: values.newEmail,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 409) {
          toast.error("This email is already in use");
          return;
        }

        if (response.status === 400 && data.errors) {
          // Handle validation errors
          Object.entries(data.errors).forEach(([field, messages]) => {
            form.setError(field as keyof ChangeEmailInput, {
              message: (messages as string[])[0],
            });
          });
          return;
        }

        throw new Error(data.message || "Failed to send verification email");
      }

      const result: ChangeEmailResponse = await response.json();
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
        <h3 className="text-xl font-bold font-mono uppercase tracking-tight">CHANGE EMAIL</h3>
        <p className="text-sm font-mono mt-1 text-gray-600">
          Update your email address. You&apos;ll need to verify the new email.
        </p>
      </div>

      <div
        className={`transition-all duration-700 ease-in-out overflow-hidden ${
          isHovered ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isHovered}
      >
        <div className="p-4 -m-2">
          <div className="mb-4">
            <label htmlFor="current-email" className="font-mono font-bold uppercase text-sm">
              Current Email
            </label>
            <div className="brutalist-input-wrapper mt-1">
              <Input
                id="current-email"
                type="email"
                value={currentEmail}
                disabled
                className="brutalist-input bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono font-bold uppercase text-sm">New Email</FormLabel>
                    <FormControl>
                      <div className="brutalist-input-wrapper">
                        <Input
                          type="email"
                          placeholder="newemail@example.com"
                          autoComplete="email"
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
                  {isSubmitting ? "SENDING..." : "SEND VERIFICATION EMAIL"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
