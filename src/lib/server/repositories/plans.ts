import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { planDays, planExercises, sessions, workoutPlans } from '../db/schema';
import { generatePlan, type GeneratedPlan } from '../engine/generatePlan';
import { loadExercisePool } from './exercises';
import { getRestrictedTagSet } from './injuries';
import { getEquipmentContextForLocation } from './equipment';
import { getActiveGoal } from './goals';

export async function generateAndSavePlan(goalId: number, locationId: number) {
	const goal = await getActiveGoal();
	if (!goal || goal.id !== goalId) throw new Error('goal is not the active goal');

	const [exercisePool, restrictedTags, availableEquipment] = await Promise.all([
		loadExercisePool(),
		getRestrictedTagSet(),
		getEquipmentContextForLocation(locationId)
	]);

	const generated: GeneratedPlan = generatePlan({
		goalType: goal.type,
		daysPerWeek: goal.daysPerWeek,
		exercisePool,
		restrictedTags,
		availableEquipment
	});

	await db.update(workoutPlans).set({ status: 'archived' }).where(eq(workoutPlans.status, 'active'));

	const [plan] = await db
		.insert(workoutPlans)
		.values({ goalId, splitType: generated.splitType, daysPerWeek: generated.daysPerWeek, status: 'active' })
		.returning();

	for (const day of generated.days) {
		const [dayRow] = await db
			.insert(planDays)
			.values({ planId: plan.id, dayIndex: day.dayIndex, label: day.label })
			.returning();

		for (const ex of day.exercises) {
			await db.insert(planExercises).values({
				planDayId: dayRow.id,
				exerciseId: ex.exerciseId,
				orderIndex: ex.orderIndex,
				targetSets: ex.targetSets,
				targetRepRangeLow: ex.targetRepRangeLow,
				targetRepRangeHigh: ex.targetRepRangeHigh,
				targetRpe: ex.targetRpe,
				progressionRule: ex.progressionRule,
				isSubstitutable: ex.isSubstitutable
			});
		}
	}

	return { plan, warnings: generated.days.flatMap((d) => d.warnings.map((w) => `${d.label}: ${w}`)) };
}

export async function getActivePlan() {
	const [plan] = await db.select().from(workoutPlans).where(eq(workoutPlans.status, 'active'));
	if (!plan) return null;

	const days = await db.select().from(planDays).where(eq(planDays.planId, plan.id)).orderBy(planDays.dayIndex);
	const dayIds = days.map((d) => d.id);
	const exercisesByDay = dayIds.length
		? await db.select().from(planExercises).where(inArray(planExercises.planDayId, dayIds)).orderBy(planExercises.orderIndex)
		: [];

	return {
		plan,
		days: days.map((day) => ({
			...day,
			exercises: exercisesByDay.filter((e) => e.planDayId === day.id)
		}))
	};
}

/** Rotates through the plan's days based on how many sessions have been completed against this plan so far. */
export async function getNextPlanDayIndex(planId: number, daysPerWeek: number): Promise<number> {
	const days = await db.select({ id: planDays.id }).from(planDays).where(eq(planDays.planId, planId));
	const dayIds = days.map((d) => d.id);
	if (dayIds.length === 0) return 0;

	const completed = dayIds.length
		? await db.select().from(sessions).where(and(inArray(sessions.planDayId, dayIds), eq(sessions.status, 'completed')))
		: [];

	return completed.length % daysPerWeek;
}
