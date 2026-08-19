export type Friend = {
  id: string;
  name: string;
  emoji: string;
  level: number;
  location: { latitude: number; longitude: number };
  status: "online" | "exploring" | "offline";
  friendCode: string;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: number;
};
