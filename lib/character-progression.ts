import type { GameCharacter } from "@/lib/characters";

export type CharacterStats = {
  power: number;
  discovery: number;
  defense: number;
  speed: number;
};

export const ROLE_STATS: Record<GameCharacter["role"], CharacterStats> = {
  warrior: { power: 90, discovery: 55, defense: 80, speed: 60 },
  archer: { power: 65, discovery: 90, defense: 45, speed: 85 },
  mage: { power: 82, discovery: 78, defense: 50, speed: 62 },
  knight: { power: 76, discovery: 60, defense: 95, speed: 52 },
  assassin: { power: 84, discovery: 86, defense: 42, speed: 94 },
};

export function getCharacterLevel(xp: number) {
  return Math.max(1, Math.floor(Math.max(0, xp) / 300) + 1);
}

export function getLevelProgress(xp: number) {
  const current = Math.max(0, xp) % 300;
  return { current, required: 300, percent: Math.min(100, Math.round((current / 300) * 100)) };
}

export function getCharacterStats(character: GameCharacter, xp: number): CharacterStats {
  const base = ROLE_STATS[character.role];
  const levelBonus = Math.min(20, Math.max(0, getCharacterLevel(xp) - 1) * 2);
  return {
    power: Math.min(100, base.power + levelBonus),
    discovery: Math.min(100, base.discovery + levelBonus),
    defense: Math.min(100, base.defense + levelBonus),
    speed: Math.min(100, base.speed + levelBonus),
  };
}

export function getClassRewardMultiplier(role: GameCharacter["role"]) {
  return role === "mage" ? 1.2 : role === "knight" ? 1.15 : role === "warrior" ? 1.1 : 1;
}
