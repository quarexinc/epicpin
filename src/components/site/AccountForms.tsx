"use client";
import Link from "next/link";
import { useActionState } from "react";
import { changeEmailAction, changePasswordAction, forgotPasswordAction, resetPasswordAction } from "@/app/actions/auth";
import { ActionForm, GoOnSuccess, Notice, Submit } from "../FormBits";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);
  return (
    <ActionForm action={action} className="grid gap-4" key={state?.ok ? "done" : "form"}>
      <div>
        <label className="label" htmlFor="current">Mevcut şifre</label>
        <input id="current" name="current" type="password" className="input h-12" autoComplete="current-password" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Yeni şifre</label>
          <input id="password" name="password" type="password" className="input h-12" autoComplete="new-password" minLength={6} required />
        </div>
        <div>
          <label className="label" htmlFor="password2">Yeni şifre (tekrar)</label>
          <input id="password2" name="password2" type="password" className="input h-12" autoComplete="new-password" minLength={6} required />
        </div>
      </div>
      <Notice state={state} />
      <Submit className="btn-ember w-full sm:w-fit">Şifreyi değiştir</Submit>
    </ActionForm>
  );
}

export function ChangeEmailForm({ email }: { email: string }) {
  const [state, action] = useActionState(changeEmailAction, undefined);
  return (
    <ActionForm action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">E-posta</label>
          <input id="email" name="email" type="email" className="input h-12" defaultValue={email} autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="current_e">Şifren</label>
          <input id="current_e" name="current" type="password" className="input h-12" autoComplete="current-password" required />
        </div>
      </div>
      <Notice state={state} />
      <Submit className="btn-ghost w-full sm:w-fit">E-postayı güncelle</Submit>
    </ActionForm>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPasswordAction, undefined);
  return (
    <ActionForm action={action} className="grid gap-4">
      <div>
        <label className="label" htmlFor="email">Hesabının e-posta adresi</label>
        <input id="email" name="email" type="email" className="input h-12" autoComplete="email" required />
      </div>
      <Notice state={state} />
      <Submit className="btn-ember h-12 text-base">Sıfırlama bağlantısı gönder</Submit>
      <p className="text-center text-sm text-mute">
        Şifreni hatırladın mı? <Link href="/giris" className="font-semibold text-ember hover:underline">Giriş yap</Link>
      </p>
    </ActionForm>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, undefined);
  return (
    <ActionForm action={action} className="grid gap-4">
      <input type="hidden" name="t" value={token} />
      <div>
        <label className="label" htmlFor="password">Yeni şifre</label>
        <input id="password" name="password" type="password" className="input h-12" autoComplete="new-password" minLength={6} required />
      </div>
      <div>
        <label className="label" htmlFor="password2">Yeni şifre (tekrar)</label>
        <input id="password2" name="password2" type="password" className="input h-12" autoComplete="new-password" minLength={6} required />
      </div>
      <Notice state={state} />
      <GoOnSuccess state={state} />
      <Submit className="btn-ember h-12 text-base">Şifremi kaydet</Submit>
    </ActionForm>
  );
}
