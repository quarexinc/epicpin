"use client";
import { useFormStatus } from "react-dom";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";

export function Submit({ children, className = "btn-ember", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function Notice({ state }: { state?: { error?: string; ok?: string } }) {
  if (!state?.error && !state?.ok) return null;
  return state.error ? (
    <div role="alert" className="flex gap-2 rounded-xl border border-plasma/30 bg-plasma/10 p-3 text-sm text-plasma">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
    </div>
  ) : (
    <div role="status" className="flex gap-2 rounded-xl border border-mint/30 bg-mint/10 p-3 text-sm text-mint">
      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> {state.ok}
    </div>
  );
}
