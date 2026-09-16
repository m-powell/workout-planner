import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { goals, type GoalType } from '../db/schema';

export interface CreateGoalInput {
	type: GoalType;
	label?: string;
	targetEventDate?: string | null;
	targetTimeframeWeeks?: number | null;
	daysPerWeek: number;
}

export async function createGoal(input: CreateGoalInput) {
	// only one active/primary goal drives generation in MVP — archive any existing active goal
	await db.update(goals).set({ status: 'archived', isPrimary: false }).where(eq(goals.status, 'active'));

	const [row] = await db
		.insert(goals)
		.values({
			type: input.type,
			label: input.label,
			targetEventDate: input.targetEventDate ?? null,
			targetTimeframeWeeks: input.targetTimeframeWeeks ?? null,
			daysPerWeek: input.daysPerWeek,
			status: 'active',
			isPrimary: true
		})
		.returning();

	return row;
}

export async function getActiveGoal() {
	const [row] = await db.select().from(goals).where(eq(goals.status, 'active'));
	return row ?? null;
}

export async function listGoals() {
	return db.select().from(goals).orderBy(goals.createdAt);
}
