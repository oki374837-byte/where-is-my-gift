export type Coordinates = { latitude: number; longitude: number };

export type QuestPoint = Coordinates & {
  id: string;
  title: string;
  kind: string;
  reward: string;
  color: string;
  rewardXp?: number;
  rewardCoins?: number;
  itemId?: string;
};
