CREATE TABLE `equipment_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`max_load_lb` real,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercise_equipment` (
	`exercise_id` integer NOT NULL,
	`equipment_category` text NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_equipment_pk` ON `exercise_equipment` (`exercise_id`,`equipment_category`);--> statement-breakpoint
CREATE TABLE `exercise_tags` (
	`exercise_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`stress_level` text DEFAULT 'primary' NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_tags_pk` ON `exercise_tags` (`exercise_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`default_unit` text DEFAULT 'lb' NOT NULL,
	`is_unilateral` integer DEFAULT false NOT NULL,
	`instructions` text,
	`is_bodyweight_fallback` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`label` text,
	`target_event_date` text,
	`start_date` text DEFAULT (current_date) NOT NULL,
	`target_timeframe_weeks` integer,
	`days_per_week` integer DEFAULT 3 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `injuries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`body_area` text NOT NULL,
	`condition_label` text,
	`severity` text DEFAULT 'moderate' NOT NULL,
	`is_chronic` integer DEFAULT false NOT NULL,
	`started_at` text DEFAULT (current_date) NOT NULL,
	`expected_recovery_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `injury_tags` (
	`injury_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	FOREIGN KEY (`injury_id`) REFERENCES `injuries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `injury_tags_pk` ON `injury_tags` (`injury_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `location_equipment` (
	`location_id` integer NOT NULL,
	`equipment_item_id` integer NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `training_locations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`equipment_item_id`) REFERENCES `equipment_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `location_equipment_pk` ON `location_equipment` (`location_id`,`equipment_item_id`);--> statement-breakpoint
CREATE TABLE `logged_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_exercise_id` integer NOT NULL,
	`set_index` integer NOT NULL,
	`weight` real,
	`weight_unit` text DEFAULT 'lb' NOT NULL,
	`reps` integer NOT NULL,
	`rpe` real,
	`is_warmup` integer DEFAULT false NOT NULL,
	`completed_at` text DEFAULT (current_timestamp) NOT NULL,
	`client_id` text NOT NULL,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `logged_sets_client_id_uq` ON `logged_sets` (`client_id`);--> statement-breakpoint
CREATE TABLE `plan_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`day_index` integer NOT NULL,
	`label` text NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `workout_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plan_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_day_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`order_index` integer NOT NULL,
	`target_sets` integer NOT NULL,
	`target_rep_range_low` integer NOT NULL,
	`target_rep_range_high` integer NOT NULL,
	`target_rpe` real DEFAULT 8 NOT NULL,
	`progression_rule` text DEFAULT 'double_progression' NOT NULL,
	`is_substitutable` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`plan_day_id`) REFERENCES `plan_days`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`order_index` integer NOT NULL,
	`source` text DEFAULT 'from_plan' NOT NULL,
	`replaced_plan_exercise_id` integer,
	`target_sets` integer NOT NULL,
	`target_rep_range_low` integer NOT NULL,
	`target_rep_range_high` integer NOT NULL,
	`target_rpe` real NOT NULL,
	`target_weight` real,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`replaced_plan_exercise_id`) REFERENCES `plan_exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_day_id` integer,
	`date` text DEFAULT (current_date) NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`started_at` text,
	`completed_at` text,
	`location_id` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`plan_day_id`) REFERENCES `plan_days`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`location_id`) REFERENCES `training_locations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_category_uq` ON `tags` (`name`,`category`);--> statement-breakpoint
CREATE TABLE `training_locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text DEFAULT 'Me' NOT NULL,
	`pin_hash` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`goal_id` integer NOT NULL,
	`split_type` text NOT NULL,
	`days_per_week` integer NOT NULL,
	`start_date` text DEFAULT (current_date) NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);
