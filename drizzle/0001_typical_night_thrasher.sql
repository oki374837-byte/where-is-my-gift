CREATE TABLE `player_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`xp` int NOT NULL DEFAULT 0,
	`coins` int NOT NULL DEFAULT 0,
	`collectedIds` json NOT NULL,
	`inventory` json NOT NULL,
	`distanceWalkedMeters` int NOT NULL DEFAULT 0,
	`visitedCount` int NOT NULL DEFAULT 0,
	`playTimeSeconds` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_progress_userId_unique` UNIQUE(`userId`)
);
