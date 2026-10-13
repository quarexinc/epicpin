import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "./data";

/** Önbelleği temizler: yönetici bir şeyi değiştirince site anında güncellenir. */
export function bust(...tags: string[]) {
  for (const t of tags.length ? tags : TAGS) revalidateTag(t);
  revalidatePath("/", "layout");
}
