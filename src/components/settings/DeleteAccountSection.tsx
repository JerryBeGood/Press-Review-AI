import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DeleteAccountResponse } from "@/types/api";

/**
 * DeleteAccountSection component
 * Allows users to permanently delete their account
 * Requires password confirmation for security
 */
export function DeleteAccountSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = async () => {
    // Validate password field
    if (!password) {
      setError("Password is required to delete account");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 401) {
          setError("Incorrect password");
          setIsDeleting(false);
          return;
        }

        throw new Error(data.message || "Failed to delete account");
      }

      const result: DeleteAccountResponse = await response.json();
      toast.success(result.message);

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setPassword("");
      setError(null);
    }
  };

  return (
    <div
      className="brutalist-box bg-red-50 border-red-500 p-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-1">
        <h3 className="text-xl font-bold font-mono uppercase tracking-tight text-red-700">DANGER ZONE</h3>
        <p className="text-sm font-mono mt-1 text-red-600">Permanently delete your account and all associated data.</p>
      </div>

      <div
        className={`transition-all duration-700 ease-in-out overflow-hidden ${
          isHovered ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isHovered}
      >
        <div className="p-4 -m-2">
          <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
              <Button variant="brutalist-destructive" className="w-full">
                DELETE ACCOUNT
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="brutalist-box bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-mono font-bold uppercase text-xl">Delete Account</AlertDialogTitle>
                <AlertDialogDescription className="font-mono text-sm text-gray-600">
                  This action cannot be undone. All your press reviews and data will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="py-4">
                <Label htmlFor="password-confirm" className="font-mono font-bold uppercase text-sm">
                  Enter your password to confirm
                </Label>
                <div className="brutalist-input-wrapper mt-2">
                  <Input
                    id="password-confirm"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="brutalist-input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    disabled={isDeleting}
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm font-mono text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="font-mono font-bold uppercase" disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] transition-all font-mono font-bold uppercase"
                >
                  {isDeleting ? "DELETING..." : "Delete Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
