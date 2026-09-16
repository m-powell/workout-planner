import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { exercises, loggedSets, sessionExercises, sessions } from '../db/schema';

export interface HistoryPoint {
	sessionId: number;
	date: string;
	setIndex: number;
	weight: number | null;
	reps: number;
	rpe: number | null;
	isWarmup: boolean;
}

export async function getExerciseHistory(exerciseId: number, limit = 200): Promise<HistoryPoint[]> {
	const rows = await db
		.select({
			sessionId: sessions.id,
			date: sessions.date,
			setIndex: loggedSets.setIndex,
			weight: loggedSets.weight,
			reps: loggedSets.reps,
			rpe: loggedSets.rpe,
			isWarmup: loggedSets.isWarmup
		})
		.from(loggedSets)
		.innerJoin(sessionExercises, eq(loggedSets.sessionExerciseId, sessionExercises.id))
		.innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
		.where(eq(sessionExercises.exerciseId, exerciseId))
		.orderBy(desc(sessions.date))
		.limit(limit);

	return rows;
}

export interface PersonalRecord {
	exerciseId: number;
	exerciseName: string;
	maxWeight: number | null;
	maxWeightReps: number | null;
	maxWeightDate: string | null;
	maxReps: number | null;
}

/** PRs computed on read (MAX over logged_sets) — data volume is tiny, no maintained cache needed. */
export async function getPersonalRecords(): Promise<PersonalRecord[]> {
	const rows = await db
		.select({
			exerciseId: exercises.id,
			exerciseName: exercises.name,
			weight: loggedSets.weight,
			reps: loggedSets.reps,
			date: sessions.date
		})
		.from(loggedSets)
		.innerJoin(sessionExercises, eq(loggedSets.sessionExerciseId, sessionExercises.id))
		.innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
		.innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
		.where(eq(loggedSets.isWarmup, false));

	const byExercise = new Map<number, { name: string; entries: typeof rows }>();
	for (const row of rows) {
		if (!byExercise.has(row.exerciseId)) byExercise.set(row.exerciseId, { name: row.exerciseName, entries: [] });
		byExercise.get(row.exerciseId)!.entries.push(row);
	}

	const prs: PersonalRecord[] = [];
	for (const [exerciseId, { name, entries }] of byExercise) {
		const withWeight = entries.filter((e) => e.weight != null);
		const best = withWeight.reduce<(typeof entries)[number] | null>((best, e) => {
			if (!best || (e.weight ?? 0) > (best.weight ?? 0)) return e;
			return best;
		}, null);
		const maxReps = entries.reduce((max, e) => Math.max(max, e.reps), 0);

		prs.push({
			exerciseId,
			exerciseName: name,
			maxWeight: best?.weight ?? null,
			maxWeightReps: best?.reps ?? null,
			maxWeightDate: best?.date ?? null,
			maxReps: entries.length > 0 ? maxReps : null
		});
	}

	return prs.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

export interface VolumePoint {
	date: string;
	volume: number;
}

export async function getVolumeOverTime(exerciseId: number): Promise<VolumePoint[]> {
	const rows = await db
		.select({
			date: sessions.date,
			weight: loggedSets.weight,
			reps: loggedSets.reps
		})
		.from(loggedSets)
		.innerJoin(sessionExercises, eq(loggedSets.sessionExerciseId, sessionExercises.id))
		.innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
		.where(eq(sessionExercises.exerciseId, exerciseId));

	const byDate = new Map<string, number>();
	for (const row of rows) {
		const vol = (row.weight ?? 0) * row.reps;
		byDate.set(row.date, (byDate.get(row.date) ?? 0) + vol);
	}

	return [...byDate.entries()].map(([date, volume]) => ({ date, volume })).sort((a, b) => a.date.localeCompare(b.date));
}
