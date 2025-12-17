import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Neo-brutalist Toaster component following the design system.
 * Features hard borders, offset shadows, and bold typography.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group font-mono bg-[var(--button-blue)"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-white text-[#383838] border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-none p-4 font-bold uppercase tracking-tight transition-all",
          description: "group-[.toast]:text-[#383838] group-[.toast]:font-mono group-[.toast]:text-sm mt-1",
          actionButton:
            "group-[.toast]:bg-[var(--button-blue)] group-[.toast]:text-black group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:rounded-none group-[.toast]:font-bold group-[.toast]:uppercase group-[.toast]:shadow-[2px_2px_0px_0px_#000] group-[.toast]:hover:shadow-[4px_4px_0px_0px_#000] group-[.toast]:transition-all ml-2",
          cancelButton:
            "group-[.toast]:bg-red-500 group-[.toast]:text-black group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:rounded-none group-[.toast]:font-bold group-[.toast]:uppercase group-[.toast]:shadow-[2px_2px_0px_0px_#000] group-[.toast]:hover:shadow-[4px_4px_0px_0px_#000] group-[.toast]:transition-all ml-2",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
