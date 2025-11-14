import { useState } from "react";
import { Button } from "@/components/ui/button";

interface UserNavProps {
  userEmail: string;
}

export function UserNav({ userEmail }: UserNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/login";
      } else {
        throw new Error("Logout failed");
      }
    } catch {
      // Handle logout error silently and reset loading state
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-foreground">{userEmail}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="gap-2"
        aria-label="Log out"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        {isLoggingOut ? "Logging out..." : "Log out"}
      </Button>
    </div>
  );
}
