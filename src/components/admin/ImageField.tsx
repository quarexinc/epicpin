"use client";
import { useRef, useState } from "react";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";

/** Görseli tarayıcıda küçültüp (maks. 1920px) forma ekler. */
async function shrink(file: File, max: number): Promise<File> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size < 900_000) return file;
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const type = file.type === "image/png" ? "image/png" : "image/webp";
  const blob: Blob | null = await new Promise((r) => c.toBlob(r, type, 0.86));
  if (!blob || blob.size > file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, type === "image/png" ? ".png" : ".webp"), { type });
}

export function ImageField({ name, label, current, hint, max = 1920, aspect = "aspect-video" }: { name: string; label: string; current?: string | null; hint?: string; max?: number; aspect?: string }) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="label">{label}</label>
      <div className={`group relative ${aspect} overflow-hidden rounded-xl border border-dashed border-line bg-coal`}>
        {preview && !removed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-center text-xs text-mute">
            <div>
              <ImagePlus className="mx-auto mb-2 h-7 w-7" />
              Görsel seç veya sürükle
            </div>
          </div>
        )}
        {busy && <div className="absolute inset-0 grid place-items-center bg-black/60"><Loader2 className="h-6 w-6 animate-spin text-ember" /></div>}
        <input
          ref={input}
          type="file"
          name={name}
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            const small = await shrink(f, max);
            if (small !== f) {
              const dt = new DataTransfer();
              dt.items.add(small);
              e.target.files = dt.files;
            }
            setPreview(URL.createObjectURL(small));
            setRemoved(false);
            setBusy(false);
          }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {hint && <p className="text-xs text-mute">{hint}</p>}
        {preview && !removed && (
          <button
            type="button"
            onClick={() => {
              setRemoved(true);
              if (input.current) input.current.value = "";
            }}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-plasma"
          >
            <Trash2 className="h-3.5 w-3.5" /> Kaldır
          </button>
        )}
      </div>
      {removed && <input type="hidden" name={`${name}_remove`} value="on" />}
    </div>
  );
}
