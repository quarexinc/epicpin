import "server-only";
import { randomUUID } from "crypto";
import { q } from "./db";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];

/** FormData içindeki dosyayı kaydeder; dosya yoksa null döner. */
export async function saveImage(file: FormDataEntryValue | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (!ALLOWED.includes(file.type)) throw new Error("Desteklenmeyen görsel türü. PNG, JPG, WEBP, GIF veya SVG yükle.");
  if (file.size > 4.5 * 1024 * 1024) throw new Error("Görsel 4.5 MB'tan küçük olmalı.");
  const id = randomUUID().replace(/-/g, "");
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  await q("INSERT INTO images (id, mime, data) VALUES ($1,$2,$3)", [id, file.type, data]);
  return id;
}

export async function deleteImage(id?: string | null) {
  if (id) await q("DELETE FROM images WHERE id = $1", [id]);
}
