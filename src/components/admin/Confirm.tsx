"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function ConfirmSubmit({ children, message = "Emin misin?", className = "btn-danger" }: { children: React.ReactNode; message?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
