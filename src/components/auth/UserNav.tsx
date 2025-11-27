import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        {isLoggingOut ? "Logging out..." : "Log out"}
      </Button>
    </div>
  );
}
