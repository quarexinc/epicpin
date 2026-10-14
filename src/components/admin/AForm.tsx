"use client";
import { useActionState } from "react";
import { ActionForm, Notice, Submit } from "../FormBits";

type Act = (s: { error?: string; ok?: string } | undefined, fd: FormData) => Promise<{ error?: string; ok?: string } | undefined>;

export function AForm({ action, children, submit = "Kaydet", className = "" }: { action: Act; children: React.ReactNode; submit?: string; className?: string }) {
  const [state, run] = useActionState(action, undefined);
  return (
    <ActionForm action={run} className={`grid gap-5 ${className}`}>
      {children}
      <Notice state={state?.error ? state : undefined} />
      <div>
        <Submit className="btn-ember px-6" pendingText="Kaydediliyor">{submit}</Submit>
      </div>
    </ActionForm>
  );
}
