import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../db/client';
import { exercises, loggedSets, planDays, planExercises, sessionExercises, sessions } from '../db/schema';
import { generateSession, type SetPerformance } from '../engine/generateSession';
import { loadExercisePool } from './exercises';
import { getRestrictedTagSet } from './injuries';
import { getEquipmentContextForLocation } from './equipment';
import { getActiveGoal } from './goals';
import { getActivePlan, getNextPlanDayIndex } from './plans';

/** Most recent completed session_exercise (with its logged working sets) for a given exercise, if any. */
async function getLastPerformance(exerciseId: number): Promise<{ targetWeight: number | null; sets: SetPerformance[] } | null> {
	const rows = await db
		.select({
			sessionExerciseId: sessionExercises.id,
			targetWeight: sessionExercises.targetWeight,
			sessionId: sessionExercises.sessionId
		})
		.from(sessionExercises)
		.innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
		.where(and(eq(sessionExercises.exerciseId, exerciseId), eq(sessions.status, 'completed')))
		.orderBy(desc(sessions.completedAt))
		.limit(1);

	const last = rows[0];
	if (!last) return null;

	const loggedRows = await db.select().from(loggedSets).where(eq(loggedSets.sessionExerciseId, last.sessionExerciseId));
	return {
		targetWeight: last.targetWeight,
		sets: loggedRows.map((s) => ({ reps: s.reps, rpe: s.rpe, weight: s.weight, isWarmup: s.isWarmup }))
	};
}

export async function startSession(locationId: number) {
	const goal = await getActiveGoal();
	if (!goal) throw new Error('no active goal — complete onboarding first');

	const activePlanData = await getActivePlan();
	if (!activePlanData) throw new Error('no active plan — generate a plan first');

	const dayIndex = await getNextPlanDayIndex(activePlanData.plan.id, activePlanData.plan.daysPerWeek);
	const planDay = activePlanData.days.find((d) => d.dayIndex === dayIndex);
	if (!planDay) throw new Error(`plan is missing day index ${dayIndex}`);

	const [exercisePool, restrictedTags, availableEquipment] = await Promise.all([
		loadExercisePool(),
		getRestrictedTagSet(),
		getEquipmentContextForLocation(locationId)
	]);

	const planExerciseIdsByOrderIndex = new Map(planDay.exercises.map((e) => [e.orderIndex, e.exerciseId]));

	const historyByExerciseId = new Map<number, SetPerformance[]>();
	const currentTargetWeightByExerciseId = new Map<number, number | null>();
	for (const exerciseId of planExerciseIdsByOrderIndex.values()) {
		const last = await getLastPerformance(exerciseId);
		historyByExerciseId.set(exerciseId, last?.sets ?? []);
		currentTargetWeightByExerciseId.set(exerciseId, last?.targetWeight ?? null);
	}

	const generated = generateSession({
		goalType: goal.type,
		daysPerWeek: activePlanData.plan.daysPerWeek,
		dayIndex,
		exercisePool,
		restrictedTags,
		availableEquipment,
		historyByExerciseId,
		currentTargetWeightByExerciseId,
		planExerciseIdsByOrderIndex
	});

	const now = new Date().toISOString();
	const [session] = await db
		.insert(sessions)
		.values({
			planDayId: planDay.id,
			date: now.slice(0, 10),
			status: 'in_progress',
			startedAt: now,
			locationId
		})
		.returning();

	const planExerciseByOrderIndex = new Map(planDay.exercises.map((e) => [e.orderIndex, e]));

	const insertedExercises = [];
	for (const ex of generated.exercises) {
		const planExercise = planExerciseByOrderIndex.get(ex.orderIndex);
		const [row] = await db
			.insert(sessionExercises)
			.values({
				sessionId: session.id,
				exerciseId: ex.exerciseId,
				orderIndex: ex.orderIndex,
				source: ex.source,
				replacedPlanExerciseId: ex.source === 'swapped' ? (planExercise?.id ?? null) : null,
				targetSets: ex.targetSets,
				targetRepRangeLow: ex.targetRepRangeLow,
				targetRepRangeHigh: ex.targetRepRangeHigh,
				targetRpe: ex.targetRpe,
				targetWeight: ex.targetWeight
			})
			.returning();
		insertedExercises.push({ ...row, rationale: ex.rationale });
	}

	return { session, label: generated.label, exercises: insertedExercises, warnings: generated.warnings };
}

export async function getSession(sessionId: number) {
	const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
	if (!session) return null;

	const rows = await db
		.select({
			sessionExercise: sessionExercises,
			exerciseName: exercises.name,
			exerciseCategory: exercises.category,
			defaultUnit: exercises.defaultUnit,
			isUnilateral: exercises.isUnilateral
		})
		.from(sessionExercises)
		.innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
		.where(eq(sessionExercises.sessionId, sessionId))
		.orderBy(sessionExercises.orderIndex);

	const exerciseIds = rows.map((r) => r.sessionExercise.id);
	const sets = exerciseIds.length
		? await db.select().from(loggedSets).where(inArray(loggedSets.sessionExerciseId, exerciseIds))
		: [];

	return {
		session,
		exercises: rows.map((r) => ({
			...r.sessionExercise,
			exerciseName: r.exerciseName,
			exerciseCategory: r.exerciseCategory,
			defaultUnit: r.defaultUnit,
			isUnilateral: r.isUnilateral,
			sets: sets.filter((s) => s.sessionExerciseId === r.sessionExercise.id)
		}))
	};
}

export async function getInProgressSession() {
	const [session] = await db.select().from(sessions).where(eq(sessions.status, 'in_progress')).orderBy(desc(sessions.startedAt)).limit(1);
	if (!session) return null;
	return getSession(session.id);
}

export interface LogSetInput {
	sessionExerciseId: number;
	setIndex: number;
	weight: number | null;
	weightUnit: 'lb' | 'kg' | 'bodyweight';
	reps: number;
	rpe: number | null;
	isWarmup: boolean;
	clientId?: string;
}

export async function logSet(input: LogSetInput) {
	const clientId = input.clientId ?? randomUUID();
	const [row] = await db
		.insert(loggedSets)
		.values({ ...input, clientId })
		.onConflictDoNothing({ target: loggedSets.clientId })
		.returning();

	if (row) return row;

	// clientId already existed (retried offline sync) — return the original row
	const [existing] = await db.select().from(loggedSets).where(eq(loggedSets.clientId, clientId));
	return existing;
}

export async function deleteLoggedSet(loggedSetId: number) {
	await db.delete(loggedSets).where(eq(loggedSets.id, loggedSetId));
}

export async function swapSessionExercise(sessionExerciseId: number, newExerciseId: number) {
	await db
		.update(sessionExercises)
		.set({ exerciseId: newExerciseId, source: 'swapped' })
		.where(eq(sessionExercises.id, sessionExerciseId));
}

export async function completeSession(sessionId: number) {
	await db
		.update(sessions)
		.set({ status: 'completed', completedAt: new Date().toISOString() })
		.where(eq(sessions.id, sessionId));
}

export async function skipSession(sessionId: number) {
	await db.update(sessions).set({ status: 'skipped' }).where(eq(sessions.id, sessionId));
}

export async function listRecentSessions(limit = 20) {
	return db.select().from(sessions).orderBy(desc(sessions.date)).limit(limit);
}
