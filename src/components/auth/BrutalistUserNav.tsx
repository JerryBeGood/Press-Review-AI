import { ArrowRight } from "lucide-react";

interface BrutalistUserNavProps {
  userEmail: string;
}

export function BrutalistUserNav({ userEmail }: BrutalistUserNavProps) {
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/login";
      }
    } catch {
      // TODO:Handle logout error
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span>{userEmail}</span>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
        aria-label="Log out"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
