export const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}?',
} as const;
export type CharacterKind = keyof typeof CHARACTER_SETS;

// Rejection sampling avoids modulo bias. No generated password is persisted.
function randomIndex(max: number): number {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Générateur cryptographique indisponible.');
  const limit = 256 - (256 % max);
  const value = new Uint8Array(1);
  do { globalThis.crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % max;
}
export function generatePassword(length: number, selected: CharacterKind[]): string {
  if (!Number.isInteger(length) || length < 8 || length > 15) throw new Error('La longueur doit être comprise entre 8 et 15 caractères.');
  const unique = [...new Set(selected)];
  if (!unique.length || unique.some(k => !(k in CHARACTER_SETS))) throw new Error('Choisissez au moins un jeu de caractères valide.');
  const sets = unique.map(k => CHARACTER_SETS[k]);
  const all = sets.join('');
  const result = sets.map(s => s[randomIndex(s.length)]);
  while (result.length < length) result.push(all[randomIndex(all.length)]);
  for (let i = result.length - 1; i > 0; i--) { const j = randomIndex(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result.join('');
}
