import {
  Gamepad2, Swords, Crosshair, Crown, Box, Monitor, Shield, Flame, Smartphone, Target, MessageCircle, Coins, Star,
  Gem, Gift, Trophy, Zap, Rocket, Ticket, Headphones, Sparkles, Music, Tv, Ghost, Joystick, Car, Dices, Wand2, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Gamepad2, Swords, Crosshair, Crown, Box, Monitor, Shield, Flame, Smartphone, Target, MessageCircle, Coins, Star,
  Gem, Gift, Trophy, Zap, Rocket, Ticket, Headphones, Sparkles, Music, Tv, Ghost, Joystick, Car, Dices, Wand2,
};

export function Icon({ name, className, style }: { name?: string | null; className?: string; style?: React.CSSProperties }) {
  const C = (name && ICONS[name]) || Gamepad2;
  return <C className={className} style={style} />;
}
