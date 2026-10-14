"use client";
import { useActionState, useState } from "react";
import { Undo2 } from "lucide-react";
import { requestRefundAction } from "@/app/actions/user";
import { ActionForm, Notice, Submit } from "../FormBits";

export function RefundForm({ itemId }: { itemId: number }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(requestRefundAction, undefined);
  if (state?.ok) return <div className="mt-4"><Notice state={state} /></div>;
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-plasma">
        <Undo2 className="h-4 w-4" /> İade talebi oluştur
      </button>
    );
  return (
    <ActionForm action={action} className="mt-4 grid gap-3 rounded-xl border border-line bg-coal p-4">
      <input type="hidden" name="item_id" value={itemId} />
      <label className="label" htmlFor={`r${itemId}`}>İade nedeni</label>
      <textarea id={`r${itemId}`} name="reason" rows={3} className="input" placeholder="Örn. kod hatalı görünüyor, kullanılmadı." required minLength={10} />
      <p className="text-xs text-mute">Kullanılmış kodlar iade edilemez. Ekibimiz kodun durumunu kontrol eder.</p>
      <Notice state={state} />
      <div className="flex gap-2">
        <Submit className="btn-danger">Talebi gönder</Submit>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Vazgeç</button>
      </div>
    </ActionForm>
  );
}
