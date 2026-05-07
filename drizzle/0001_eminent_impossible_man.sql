CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `resource_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`collectionId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`contentType` enum('link','text') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `collections_userId_idx` ON `collections` (`userId`);--> statement-breakpoint
CREATE INDEX `resource_tags_resourceId_idx` ON `resource_tags` (`resourceId`);--> statement-breakpoint
CREATE INDEX `resource_tags_tagId_idx` ON `resource_tags` (`tagId`);--> statement-breakpoint
CREATE INDEX `resources_userId_idx` ON `resources` (`userId`);--> statement-breakpoint
CREATE INDEX `resources_collectionId_idx` ON `resources` (`collectionId`);--> statement-breakpoint
CREATE INDEX `tags_userId_idx` ON `tags` (`userId`);--> statement-breakpoint
CREATE INDEX `tags_userId_name_idx` ON `tags` (`userId`,`name`);