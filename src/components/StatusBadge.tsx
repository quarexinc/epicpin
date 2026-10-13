import { STATUS_TR } from "@/lib/utils";

const C: Record<string, string> = {
  pending: "bg-blaze/15 text-blaze",
  delivered: "bg-mint/15 text-mint",
  approved: "bg-mint/15 text-mint",
  refunded: "bg-violet-400/15 text-violet-300",
  rejected: "bg-plasma/15 text-plasma",
  open: "bg-blaze/15 text-blaze",
  customer_reply: "bg-blaze/15 text-blaze",
  answered: "bg-mint/15 text-mint",
  closed: "bg-smoke text-mute",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-bold ${C[status] ?? "bg-smoke text-mute"}`}>{label ?? STATUS_TR[status] ?? status}</span>;
}
