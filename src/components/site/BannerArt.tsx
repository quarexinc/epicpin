export const THEMES: Record<string, { a: string; b: string; c: string; bg: string; name: string }> = {
  ember: { a: "#FFB224", b: "#FF6A13", c: "#FF3D6E", bg: "#1B0E07", name: "Turuncu" },
  plasma: { a: "#FF8A5B", b: "#FF3D6E", c: "#B8146B", bg: "#1A0812", name: "Neon pembe" },
  violet: { a: "#B69CFF", b: "#7C5CFF", c: "#FF6A13", bg: "#0F0B1F", name: "Mor" },
  lime: { a: "#E7FF6B", b: "#9BE22F", c: "#FF6A13", bg: "#0D1408", name: "Asit yeşil" },
  ice: { a: "#9BE7FF", b: "#3BA7FF", c: "#FF6A13", bg: "#07111C", name: "Buz mavisi" },
};

/** Görsel yüklenmemiş bannerlar için üretilen sahne: kupon kartı, jeton ve kristal. */
export function BannerArt({ theme = "ember", seed = 0, className = "" }: { theme?: string; seed?: number; className?: string }) {
  const t = THEMES[theme] ?? THEMES.ember;
  const id = `ba${seed}${theme}`;
  return (
    <svg viewBox="0 0 520 440" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}g1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.a} />
          <stop offset=".6" stopColor={t.b} />
          <stop offset="1" stopColor={t.c} />
        </linearGradient>
        <linearGradient id={`${id}g2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}glow`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={t.b} stopOpacity=".55" />
          <stop offset="1" stopColor={t.b} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}sh`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000" floodOpacity=".55" />
        </filter>
      </defs>
      <circle cx="300" cy="220" r="210" fill={`url(#${id}glow)`} />
      {/* yörünge halkaları */}
      <ellipse cx="300" cy="230" rx="230" ry="70" fill="none" stroke={t.a} strokeOpacity=".18" strokeWidth="1.5" transform="rotate(-14 300 230)" />
      <ellipse cx="300" cy="230" rx="170" ry="48" fill="none" stroke={t.a} strokeOpacity=".12" strokeWidth="1" strokeDasharray="4 8" transform="rotate(-14 300 230)" />

      {/* kristal */}
      <g className="animate-floaty" style={{ transformOrigin: "380px 150px", animationDelay: "-2s" }} filter={`url(#${id}sh)`}>
        <polygon points="380,60 440,120 380,240 320,120" fill={`url(#${id}g1)`} />
        <polygon points="380,60 440,120 380,138 320,120" fill="#fff" fillOpacity=".28" />
        <polygon points="380,138 440,120 380,240" fill="#000" fillOpacity=".22" />
        <polygon points="380,60 400,120 380,138 360,120" fill="#fff" fillOpacity=".25" />
      </g>

      {/* kupon kartı */}
      <g className="animate-floaty" style={{ transformOrigin: "250px 260px", animationDelay: "-0.5s" }} filter={`url(#${id}sh)`}>
        <g transform="rotate(-12 250 260)">
          <path
            d="M150 195h200a16 16 0 0 1 16 16v28a14 14 0 0 0 0 28v28a16 16 0 0 1-16 16H150a16 16 0 0 1-16-16v-28a14 14 0 0 0 0-28v-28a16 16 0 0 1 16-16Z"
            fill="#15121A"
            stroke={t.b}
            strokeOpacity=".7"
            strokeWidth="2"
          />
          <rect x="160" y="212" width="70" height="10" rx="5" fill={t.a} opacity=".9" />
          <rect x="160" y="230" width="110" height="7" rx="3.5" fill="#fff" opacity=".18" />
          <line x1="150" y1="253" x2="350" y2="253" stroke="#fff" strokeOpacity=".18" strokeDasharray="6 6" />
          <text x="160" y="291" fill="#fff" fontFamily="'Unbounded Variable', sans-serif" fontWeight="800" fontSize="22" letterSpacing="2">
            7XK4-PQ9A
          </text>
          <circle cx="330" cy="222" r="10" fill={`url(#${id}g1)`} />
        </g>
      </g>

      {/* jetonlar */}
      {[
        [120, 120, 38, "-3s"],
        [440, 330, 30, "-1s"],
        [90, 360, 22, "-4s"],
      ].map(([x, y, r, d], i) => (
        <g key={i} className="animate-floaty" style={{ animationDelay: d as string, transformOrigin: `${x}px ${y}px` }} filter={`url(#${id}sh)`}>
          <ellipse cx={x as number} cy={(y as number) + 6} rx={r as number} ry={(r as number) * 0.92} fill={t.c} />
          <ellipse cx={x as number} cy={y as number} rx={r as number} ry={(r as number) * 0.92} fill={`url(#${id}g1)`} />
          <ellipse cx={x as number} cy={y as number} rx={(r as number) * 0.68} ry={(r as number) * 0.62} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
          <path
            d={`M${(x as number) + 3} ${(y as number) - (r as number) * 0.42} l-${(r as number) * 0.32} ${(r as number) * 0.5} h${(r as number) * 0.22} l-${(r as number) * 0.08} ${(r as number) * 0.36} l${(r as number) * 0.32} -${(r as number) * 0.5} h-${(r as number) * 0.22}Z`}
            fill="#fff"
            fillOpacity=".9"
          />
          <ellipse cx={(x as number) - (r as number) * 0.3} cy={(y as number) - (r as number) * 0.35} rx={(r as number) * 0.3} ry={(r as number) * 0.14} fill={`url(#${id}g2)`} />
        </g>
      ))}

      {/* kıvılcımlar */}
      {[
        [470, 70, 9],
        [200, 80, 6],
        [60, 250, 7],
        [490, 230, 5],
      ].map(([x, y, s], i) => (
        <path key={i} d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`} fill={t.a} opacity=".85" />
      ))}
    </svg>
  );
}
