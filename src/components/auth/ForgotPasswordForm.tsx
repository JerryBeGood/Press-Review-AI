import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth.schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: ForgotPasswordInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send reset email");
      }

      setSuccess(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="brutalist-box bg-white p-6 sm:p-8">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-[var(--yellow-banner)]">
            <Mail className="h-8 w-8 text-black" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-mono uppercase tracking-tight">CHECK YOUR EMAIL</h3>
            <p className="text-sm font-mono mt-2">
              If an account exists with that email, we&apos;ve sent you a link to reset your password.
            </p>
          </div>
          <Button variant="brutalist" asChild className="w-full">
            <a href="/login">BACK TO SIGN IN</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="brutalist-box bg-white p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-mono uppercase tracking-tight">RESET PASSWORD</h2>
        <p className="text-sm font-mono mt-1">Enter your email to receive a password reset link</p>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono font-bold uppercase text-sm">Email</FormLabel>
                <FormControl>
                  <div className="brutalist-input-wrapper">
                    <Input
                      type="email"
                      placeholder="you@example.com"
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

          <Button type="submit" disabled={isSubmitting} variant="brutalist" className="w-full">
            {isSubmitting ? "SENDING..." : "SEND RESET LINK"}
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
