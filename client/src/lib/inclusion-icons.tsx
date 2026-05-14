import {
  GlassWater, LifeBuoy, Waves, UserCheck, UtensilsCrossed, Backpack,
  Camera, Sun, Shield, Anchor, Wind, Compass, Star, Package, Coffee,
  Map, Zap, Heart, Smile, Music, type LucideProps,
} from "lucide-react";

export const INCLUSION_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  GlassWater,
  LifeBuoy,
  Waves,
  UserCheck,
  UtensilsCrossed,
  Backpack,
  Camera,
  Sun,
  Shield,
  Anchor,
  Wind,
  Compass,
  Star,
  Package,
  Coffee,
  Map,
  Zap,
  Heart,
  Smile,
  Music,
};

export const INCLUSION_ICON_OPTIONS = Object.keys(INCLUSION_ICON_MAP);

export function InclusionIcon({ icon, className }: { icon: string; className?: string }) {
  const Comp = INCLUSION_ICON_MAP[icon] ?? Star;
  return <Comp className={className} />;
}
