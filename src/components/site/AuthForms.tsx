"use client";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";
import { Notice, Submit } from "../FormBits";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="identifier">E-posta veya kullanıcı adı</label>
        <input id="identifier" name="identifier" className="input h-12" autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Şifre</label>
        <input id="password" name="password" type="password" className="input h-12" autoComplete="current-password" required />
      </div>
      <Notice state={state} />
      <Submit className="btn-ember h-12 text-base">Giriş yap</Submit>
      <p className="text-center text-sm text-mute">
        Hesabın yok mu? <Link href={`/kayit${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-ember hover:underline">Kayıt ol</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState(registerAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="username">Kullanıcı adı</label>
        <input id="username" name="username" className="input h-12" autoComplete="username" required minLength={3} maxLength={20} />
      </div>
      <div>
        <label className="label" htmlFor="email">E-posta</label>
        <input id="email" name="email" type="email" className="input h-12" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Şifre</label>
        <input id="password" name="password" type="password" className="input h-12" autoComplete="new-password" required minLength={6} />
        <p className="mt-1 text-xs text-mute">En az 6 karakter.</p>
      </div>
      <label className="flex items-start gap-2.5 text-sm text-mute">
        <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 accent-[#FF6A13]" required />
        Kullanım koşullarını ve gizlilik politikasını okudum, kabul ediyorum.
      </label>
      <Notice state={state} />
      <Submit className="btn-ember h-12 text-base">Hesabımı oluştur</Submit>
      <p className="text-center text-sm text-mute">
        Zaten üye misin? <Link href="/giris" className="font-semibold text-ember hover:underline">Giriş yap</Link>
      </p>
    </form>
  );
}
