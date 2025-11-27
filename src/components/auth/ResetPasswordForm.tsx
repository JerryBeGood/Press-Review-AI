import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth.schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check for password recovery hash in URL
    // This will be implemented when Supabase client is set up
    // For now, we just enable the form
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    if (type === "recovery") {
      setIsReady(true);
    } else {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = async (values: ResetPasswordInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // This will be implemented with Supabase client in the backend implementation phase
      // For now, we'll just show a placeholder error
      throw new Error("Password reset functionality will be implemented in the backend phase");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!isReady && error) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="text-center space-y-4">
          <div className="mx-auto w-fit p-4 rounded-full bg-destructive/10">
            <AlertTriangle className="h-12 w-12 text-destructive" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Invalid reset link</h3>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          <Button asChild className="w-full">
            <a href="/forgot-password">Request new link</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Set new password</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting || !isReady} className="w-full">
            {isSubmitting ? "Updating password..." : "Update password"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <a href="/login" className="text-primary hover:underline">
          Sign in
        </a>
      </div>
    </div>
  );
}
