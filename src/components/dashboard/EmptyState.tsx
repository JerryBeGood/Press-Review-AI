import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateFirst: () => void;
}

export function EmptyState({ onCreateFirst }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="text-muted-foreground">
          <div className="mx-auto w-fit p-4 rounded-full bg-primary/10 mb-6">
            <svg
              className="h-12 w-12 sm:h-16 sm:w-16 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Brak zaplanowanych prasówek</h3>
          <p className="text-sm sm:text-base mb-6 leading-relaxed">
            Zacznij od stworzenia swojej pierwszej prasówki. Zdefiniuj temat i harmonogram, a my automatycznie
            wygenerujemy dla Ciebie cykliczne podsumowania.
          </p>
        </div>
        <Button onClick={onCreateFirst} size="lg" className="w-full sm:w-auto">
          Stwórz pierwszą prasówkę
        </Button>
      </div>
    </div>
  );
}
