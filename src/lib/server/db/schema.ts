import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import {
	goalTypeValues,
	equipmentCategoryValues,
	injurySeverityValues,
	tagCategoryValues,
	type GoalType,
	type EquipmentCategory,
	type InjurySeverity,
	type TagCategory
} from '../../shared/enums';

export { goalTypeValues, equipmentCategoryValues, injurySeverityValues, tagCategoryValues };
export type { GoalType, EquipmentCategory, InjurySeverity, TagCategory };

const timestamps = {
	createdAt: text('created_at')
		.notNull()
		.default(sql`(current_timestamp)`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(current_timestamp)`)
};

// ---------- Profile / Goals ----------

export const userProfile = sqliteTable('user_profile', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	displayName: text('display_name').notNull().default('Me'),
	pinHash: text('pin_hash'),
	...timestamps
});

export const goalStatusValues = ['active', 'completed', 'archived'] as const;
export type GoalStatus = (typeof goalStatusValues)[number];

export const goals = sqliteTable('goals', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	type: text('type').$type<GoalType>().notNull(),
	label: text('label'),
	targetEventDate: text('target_event_date'),
	startDate: text('start_date')
		.notNull()
		.default(sql`(current_date)`),
	targetTimeframeWeeks: integer('target_timeframe_weeks'),
	daysPerWeek: integer('days_per_week').notNull().default(3),
	status: text('status').$type<GoalStatus>().notNull().default('active'),
	isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
	...timestamps
});

// ---------- Equipment / Access ----------

export const equipmentItems = sqliteTable('equipment_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	category: text('category').$type<EquipmentCategory>().notNull(),
	maxLoadLb: real('max_load_lb'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});

export const trainingLocations = sqliteTable('training_locations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false)
});

export const locationEquipment = sqliteTable(
	'location_equipment',
	{
		locationId: integer('location_id')
			.notNull()
			.references(() => trainingLocations.id, { onDelete: 'cascade' }),
		equipmentItemId: integer('equipment_item_id')
			.notNull()
			.references(() => equipmentItems.id, { onDelete: 'cascade' })
	},
	(t) => [uniqueIndex('location_equipment_pk').on(t.locationId, t.equipmentItemId)]
);

// ---------- Tag taxonomy (shared by exercises + injuries) ----------

export const tags = sqliteTable(
	'tags',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		category: text('category').$type<TagCategory>().notNull()
	},
	(t) => [uniqueIndex('tags_name_category_uq').on(t.name, t.category)]
);

// ---------- Injuries ----------

export const injuryStatusValues = ['active', 'healed', 'archived'] as const;
export type InjuryStatus = (typeof injuryStatusValues)[number];

export const injuries = sqliteTable('injuries', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	bodyArea: text('body_area').notNull(),
	conditionLabel: text('condition_label'),
	severity: text('severity').$type<InjurySeverity>().notNull().default('moderate'),
	isChronic: integer('is_chronic', { mode: 'boolean' }).notNull().default(false),
	startedAt: text('started_at')
		.notNull()
		.default(sql`(current_date)`),
	expectedRecoveryDate: text('expected_recovery_date'),
	status: text('status').$type<InjuryStatus>().notNull().default('active'),
	notes: text('notes'),
	...timestamps
});

export const injuryTags = sqliteTable(
	'injury_tags',
	{
		injuryId: integer('injury_id')
			.notNull()
			.references(() => injuries.id, { onDelete: 'cascade' }),
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(t) => [uniqueIndex('injury_tags_pk').on(t.injuryId, t.tagId)]
);

// ---------- Exercise library ----------

export const exerciseCategoryValues = ['compound', 'isolation', 'cardio', 'mobility'] as const;
export type ExerciseCategory = (typeof exerciseCategoryValues)[number];

export const exercises = sqliteTable('exercises', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	category: text('category').$type<ExerciseCategory>().notNull(),
	defaultUnit: text('default_unit').$type<'lb' | 'kg' | 'bodyweight'>().notNull().default('lb'),
	isUnilateral: integer('is_unilateral', { mode: 'boolean' }).notNull().default(false),
	instructions: text('instructions'),
	/** true if this exercise requires no equipment (guaranteed injury/equipment-safe fallback) */
	isBodyweightFallback: integer('is_bodyweight_fallback', { mode: 'boolean' })
		.notNull()
		.default(false)
});

export const stressLevelValues = ['primary', 'secondary'] as const;
export type StressLevel = (typeof stressLevelValues)[number];

export const exerciseTags = sqliteTable(
	'exercise_tags',
	{
		exerciseId: integer('exercise_id')
			.notNull()
			.references(() => exercises.id, { onDelete: 'cascade' }),
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
		stressLevel: text('stress_level').$type<StressLevel>().notNull().default('primary')
	},
	(t) => [uniqueIndex('exercise_tags_pk').on(t.exerciseId, t.tagId)]
);

export const exerciseEquipment = sqliteTable(
	'exercise_equipment',
	{
		exerciseId: integer('exercise_id')
			.notNull()
			.references(() => exercises.id, { onDelete: 'cascade' }),
		equipmentCategory: text('equipment_category').$type<EquipmentCategory>().notNull(),
		required: integer('required', { mode: 'boolean' }).notNull().default(true)
	},
	(t) => [uniqueIndex('exercise_equipment_pk').on(t.exerciseId, t.equipmentCategory)]
);

// ---------- Plans / Sessions / Logging ----------

export const planStatusValues = ['active', 'completed', 'archived'] as const;
export type PlanStatus = (typeof planStatusValues)[number];

export const workoutPlans = sqliteTable('workout_plans', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	goalId: integer('goal_id')
		.notNull()
		.references(() => goals.id, { onDelete: 'cascade' }),
	splitType: text('split_type').notNull(),
	daysPerWeek: integer('days_per_week').notNull(),
	startDate: text('start_date')
		.notNull()
		.default(sql`(current_date)`),
	status: text('status').$type<PlanStatus>().notNull().default('active'),
	...timestamps
});

export const planDays = sqliteTable('plan_days', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	planId: integer('plan_id')
		.notNull()
		.references(() => workoutPlans.id, { onDelete: 'cascade' }),
	dayIndex: integer('day_index').notNull(),
	label: text('label').notNull()
});

export const progressionRuleValues = ['double_progression', 'fixed'] as const;
export type ProgressionRule = (typeof progressionRuleValues)[number];

export const planExercises = sqliteTable('plan_exercises', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	planDayId: integer('plan_day_id')
		.notNull()
		.references(() => planDays.id, { onDelete: 'cascade' }),
	exerciseId: integer('exercise_id')
		.notNull()
		.references(() => exercises.id),
	orderIndex: integer('order_index').notNull(),
	targetSets: integer('target_sets').notNull(),
	targetRepRangeLow: integer('target_rep_range_low').notNull(),
	targetRepRangeHigh: integer('target_rep_range_high').notNull(),
	targetRpe: real('target_rpe').notNull().default(8),
	progressionRule: text('progression_rule').$type<ProgressionRule>().notNull().default('double_progression'),
	isSubstitutable: integer('is_substitutable', { mode: 'boolean' }).notNull().default(true)
});

export const sessionStatusValues = ['planned', 'in_progress', 'completed', 'skipped'] as const;
export type SessionStatus = (typeof sessionStatusValues)[number];

export const sessions = sqliteTable('sessions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	planDayId: integer('plan_day_id').references(() => planDays.id, { onDelete: 'set null' }),
	date: text('date')
		.notNull()
		.default(sql`(current_date)`),
	status: text('status').$type<SessionStatus>().notNull().default('planned'),
	startedAt: text('started_at'),
	completedAt: text('completed_at'),
	locationId: integer('location_id').references(() => trainingLocations.id, { onDelete: 'set null' }),
	...timestamps
});

export const sessionExerciseSourceValues = ['from_plan', 'swapped', 'added_extra'] as const;
export type SessionExerciseSource = (typeof sessionExerciseSourceValues)[number];

export const sessionExercises = sqliteTable('session_exercises', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	sessionId: integer('session_id')
		.notNull()
		.references(() => sessions.id, { onDelete: 'cascade' }),
	exerciseId: integer('exercise_id')
		.notNull()
		.references(() => exercises.id),
	orderIndex: integer('order_index').notNull(),
	source: text('source').$type<SessionExerciseSource>().notNull().default('from_plan'),
	replacedPlanExerciseId: integer('replaced_plan_exercise_id').references(() => planExercises.id, {
		onDelete: 'set null'
	}),
	// snapshotted targets so later plan edits don't rewrite history
	targetSets: integer('target_sets').notNull(),
	targetRepRangeLow: integer('target_rep_range_low').notNull(),
	targetRepRangeHigh: integer('target_rep_range_high').notNull(),
	targetRpe: real('target_rpe').notNull(),
	targetWeight: real('target_weight')
});

export const loggedSets = sqliteTable(
	'logged_sets',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		sessionExerciseId: integer('session_exercise_id')
			.notNull()
			.references(() => sessionExercises.id, { onDelete: 'cascade' }),
		setIndex: integer('set_index').notNull(),
		weight: real('weight'),
		weightUnit: text('weight_unit').$type<'lb' | 'kg' | 'bodyweight'>().notNull().default('lb'),
		reps: integer('reps').notNull(),
		rpe: real('rpe'),
		isWarmup: integer('is_warmup', { mode: 'boolean' }).notNull().default(false),
		completedAt: text('completed_at')
			.notNull()
			.default(sql`(current_timestamp)`),
		/** client-generated UUID; dedupes retried offline syncs */
		clientId: text('client_id').notNull()
	},
	(t) => [uniqueIndex('logged_sets_client_id_uq').on(t.clientId)]
);

export const injuriesStatusIdx = index('injuries_status_idx').on(injuries.status);
export const sessionsDateIdx = index('sessions_date_idx').on(sessions.date);
export const loggedSetsSessionExerciseIdx = index('logged_sets_session_exercise_idx').on(
	loggedSets.sessionExerciseId
);
