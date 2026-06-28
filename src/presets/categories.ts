const CATEGORY_LABELS: Record<string, string> = {
  signature: 'Signature',
  soundWorlds: 'Sound Worlds',
  flora: 'Flora',
  ambient: 'Ambient',
  textures: 'Textures',
  drones: 'Drones',
  percussion: 'Percussion',
};

export function formatCategoryLabel(categoryId: string): string {
  return (
    CATEGORY_LABELS[categoryId] ??
    categoryId
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}
