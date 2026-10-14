import clsx from "clsx";
import { useId } from "react";

/** EpicPin işareti: yan kenarları çentikli bir e-pin kuponu ve içinden geçen şimşek. */
export function LogoMark({ className, id: idProp }: { className?: string; id?: string }) {
  // Her işaretin kendi gradyan kimliği olmalı; gizli bir kopyadaki gradyana bağlanırsa logo görünmez olur
  const auto = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = idProp ?? `ep${auto}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="6" y1="6" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFB224" />
          <stop offset=".55" stopColor="#FF6A13" />
          <stop offset="1" stopColor="#FF3D6E" />
        </linearGradient>
      </defs>
      <g transform="rotate(-10 24 24)">
        <path
          fill={`url(#${id}-g)`}
          fillRule="evenodd"
          d="M11 9h26a6 6 0 0 1 6 6v4.2a4.8 4.8 0 0 0 0 9.6V33a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6v-4.2a4.8 4.8 0 0 0 0-9.6V15a6 6 0 0 1 6-6Zm15.6 5.5L16.4 26.2h6.4L20.6 33.5 31.8 21h-6.6l1.4-6.5Z"
        />
        <path d="M34.5 12.5v23" stroke="#0A090C" strokeOpacity=".35" strokeWidth="1.4" strokeDasharray="2.2 2.2" />
      </g>
    </svg>
  );
}

export function Logo({ className, logoUrl, size = "md" }: { className?: string; logoUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="EpicPin" className={clsx(size === "lg" ? "h-14" : size === "sm" ? "h-8" : "h-10", "w-auto", className)} />;
  }
  return (
    <span className={clsx("inline-flex items-center gap-2 select-none", className)}>
      <LogoMark className={size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-8 w-8 sm:h-10 sm:w-10"} />
      <span
        className={clsx(
          "font-display font-extrabold tracking-[-0.04em] leading-none",
          size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-[1.3rem] sm:text-[1.6rem]",
        )}
      >
        <span className="text-bone">Epic</span>
        <span className="bg-gradient-to-r from-blaze via-ember to-plasma bg-clip-text text-transparent">Pin</span>
      </span>
    </span>
  );
}
