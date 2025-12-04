import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth.schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  showVerificationSuccess?: boolean;
}

export function LoginForm({ showVerificationSuccess }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: LoginInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid credentials");
      }

      // Redirect will be handled by the API endpoint
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="brutalist-box bg-white p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-mono uppercase tracking-tight">SIGN IN</h2>
        <p className="text-sm font-mono mt-1">Enter your credentials to access your account</p>
      </div>

      {showVerificationSuccess && (
        <div
          className="mb-6 brutalist-box bg-[var(--yellow-banner)] p-3 text-sm font-mono font-bold"
          role="status"
          aria-live="polite"
        >
          Your email has been verified. You can now sign in.
        </div>
      )}

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono font-bold uppercase text-sm">Password</FormLabel>
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

          <Button type="submit" disabled={isSubmitting} variant="brutalist" className="w-full">
            {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm font-mono">
        Don&apos;t have an account?{" "}
        <a href="/register" className="font-bold underline underline-offset-4 hover:opacity-70 transition-opacity">
          Sign up
        </a>
      </div>
    </div>
  );
}
