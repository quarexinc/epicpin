"use client";
import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";

const PendingCtx = createContext<{ pending: boolean; ready: boolean } | null>(null);

/**
 * Sunucu işlemi çalıştıran form. React 19 "action" ile gönderilen formları işlem bitince
 * otomatik sıfırlar (kullanıcı hata alınca yazdıkları silinir). Bu bileşen formu elle gönderir,
 * böylece hata durumunda girilen bilgiler yerinde kalır.
 */
export function ActionForm({
  action,
  children,
  className,
  ...rest
}: { action: (fd: FormData) => void; children: React.ReactNode; className?: string } & Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit">) {
  const [pending, start] = useTransition();
  // Sayfa tam yüklenmeden (JavaScript hazır değilken) basılırsa tarayıcı formu kendi gönderirdi;
  // buton hazır olana kadar kilitli kalır, method="post" de bilgilerin adres çubuğuna yazılmasını engeller.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <PendingCtx.Provider value={{ pending, ready }}>
      <form
        method="post"
        {...rest}
        className={className}
        aria-busy={pending}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
          const fd = new FormData(e.currentTarget, submitter && submitter.getAttribute("name") ? submitter : undefined);
          start(() => action(fd));
        }}
      >
        {children}
      </form>
    </PendingCtx.Provider>
  );
}

export function Submit({ children, className = "btn-ember", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const status = useFormStatus();
  const ctx = useContext(PendingCtx);
  const pending = status.pending || !!ctx?.pending;
  return (
    <button type="submit" disabled={pending || (ctx ? !ctx.ready : false)} className={className}>
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

/** Sunucu işlemi başarılı olunca tam sayfa yenilemeyle hedefe gider (oturum değişikliklerinde güvenli yol). */
export function GoOnSuccess({ state }: { state?: { go?: string } }) {
  const go = state?.go;
  useEffect(() => {
    if (go) window.location.assign(go);
  }, [go, state]);
  return null;
}
