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
      <div className="brutalist-box bg-white p-6 sm:p-8">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-red-500">
            <AlertTriangle className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-mono uppercase tracking-tight">INVALID RESET LINK</h3>
            <p className="text-sm font-mono mt-2">{error}</p>
          </div>
          <Button variant="brutalist" asChild className="w-full">
            <a href="/forgot-password">REQUEST NEW LINK</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="brutalist-box bg-white p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-mono uppercase tracking-tight">SET NEW PASSWORD</h2>
        <p className="text-sm font-mono mt-1">Enter your new password below</p>
      </div>

      {error && (
        <div className="mb-6 brutalist-box bg-red-100 p-3 text-sm font-mono" role="alert" aria-live="polite">
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
                <FormLabel className="font-mono font-bold uppercase text-sm">New password</FormLabel>
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
                <FormLabel className="font-mono font-bold uppercase text-sm">Confirm new password</FormLabel>
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

          <Button type="submit" disabled={isSubmitting || !isReady} variant="brutalist" className="w-full">
            {isSubmitting ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm font-mono">
        Remember your password?{" "}
        <a href="/login" className="font-bold underline underline-offset-4 hover:opacity-70 transition-opacity">
          Sign in
        </a>
      </div>
    </div>
  );
}
