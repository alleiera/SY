import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  Box,
  Circle,
  Factory,
  Flame,
  Layers,
  Package,
  PackageCheck,
  Scissors,
  Settings,
  Truck,
  Wrench,
} from 'lucide-react';

export const RECIPE_ICONS = {
  Archive,
  Box,
  Circle,
  Factory,
  Flame,
  Layers,
  Package,
  PackageCheck,
  Scissors,
  Settings,
  Truck,
  Wrench,
} satisfies Record<string, LucideIcon>;

export const getRecipeIcon = (iconName?: string): LucideIcon => (
  iconName && RECIPE_ICONS[iconName as keyof typeof RECIPE_ICONS]
    ? RECIPE_ICONS[iconName as keyof typeof RECIPE_ICONS]
    : Box
);
