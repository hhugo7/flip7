// Génère un code partie à 4 lettres majuscules
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // sans I et O pour éviter confusion
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Couleurs avatar par index
const AVATAR_COLORS = [
  { bg: '#3B82F6', text: '#fff' },
  { bg: '#10B981', text: '#fff' },
  { bg: '#F59E0B', text: '#fff' },
  { bg: '#EF4444', text: '#fff' },
  { bg: '#8B5CF6', text: '#fff' },
  { bg: '#EC4899', text: '#fff' },
  { bg: '#06B6D4', text: '#fff' },
  { bg: '#F97316', text: '#fff' },
]

export function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

export function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}
