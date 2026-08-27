export interface ColorTheme {
  id: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  avatarBg: string;
  avatarText: string;
  activeRing: string;
  accentBar: string;
}

export const FRIEND_COLORS: ColorTheme[] = [
  {
    id: 'blue',
    name: 'Blue',
    badgeBg: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    avatarBg: 'bg-blue-500 text-white',
    avatarText: 'text-blue-600',
    activeRing: 'ring-blue-500',
    accentBar: 'bg-blue-500',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    avatarBg: 'bg-emerald-500 text-white',
    avatarText: 'text-emerald-600',
    activeRing: 'ring-emerald-500',
    accentBar: 'bg-emerald-500',
  },
  {
    id: 'amber',
    name: 'Amber',
    badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    avatarBg: 'bg-amber-500 text-white',
    avatarText: 'text-amber-600',
    activeRing: 'ring-amber-500',
    accentBar: 'bg-amber-500',
  },
  {
    id: 'rose',
    name: 'Rose',
    badgeBg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
    avatarBg: 'bg-rose-500 text-white',
    avatarText: 'text-rose-600',
    activeRing: 'ring-rose-500',
    accentBar: 'bg-rose-500',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    badgeBg: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    avatarBg: 'bg-indigo-600 text-white',
    avatarText: 'text-indigo-600',
    activeRing: 'ring-indigo-500',
    accentBar: 'bg-indigo-500',
  },
  {
    id: 'violet',
    name: 'Violet',
    badgeBg: 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    badgeText: 'text-violet-700 dark:text-violet-300',
    badgeBorder: 'border-violet-200 dark:border-violet-800',
    avatarBg: 'bg-violet-600 text-white',
    avatarText: 'text-violet-600',
    activeRing: 'ring-violet-500',
    accentBar: 'bg-violet-500',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    badgeBg: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800',
    avatarBg: 'bg-cyan-600 text-white',
    avatarText: 'text-cyan-600',
    activeRing: 'ring-cyan-500',
    accentBar: 'bg-cyan-500',
  },
  {
    id: 'teal',
    name: 'Teal',
    badgeBg: 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-200 dark:border-teal-800',
    avatarBg: 'bg-teal-600 text-white',
    avatarText: 'text-teal-600',
    activeRing: 'ring-teal-500',
    accentBar: 'bg-teal-500',
  },
];

export function getColorTheme(colorId?: string): ColorTheme {
  const found = FRIEND_COLORS.find(c => c.id === colorId);
  return found || FRIEND_COLORS[0];
}
