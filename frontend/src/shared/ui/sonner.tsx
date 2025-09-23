import { Toaster, toast as sonnerToast } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      expand
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-line",
          title: "font-medium",
          description: "text-sm text-slate-600",
          actionButton: "rounded-full",
          cancelButton: "rounded-full",
        },
      }}
    />
  );
}
export const toast = sonnerToast;
