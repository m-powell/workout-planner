import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { exerciseEquipment, exerciseTags, exercises, tags } from '../db/schema';
import type { ExerciseRecord } from '../engine/types';

/** Loads the full exercise library, joined with tags and equipment, in the shape the engine expects. */
export async function loadExercisePool(): Promise<ExerciseRecord[]> {
	const [exerciseRows, tagRows, equipmentRows, tagDefs] = await Promise.all([
		db.select().from(exercises),
		db.select().from(exerciseTags),
		db.select().from(exerciseEquipment),
		db.select().from(tags)
	]);

	const tagById = new Map(tagDefs.map((t) => [t.id, t]));

	return exerciseRows.map((ex) => ({
		id: ex.id,
		name: ex.name,
		category: ex.category,
		isBodyweightFallback: ex.isBodyweightFallback,
		equipment: equipmentRows.filter((eq_) => eq_.exerciseId === ex.id).map((eq_) => eq_.equipmentCategory),
		tags: tagRows
			.filter((t) => t.exerciseId === ex.id)
			.map((t) => {
				const def = tagById.get(t.tagId)!;
				return { name: def.name, category: def.category, stressLevel: t.stressLevel };
			})
	}));
}

export async function getExerciseById(id: number) {
	const [row] = await db.select().from(exercises).where(eq(exercises.id, id));
	return row ?? null;
}

export async function listAllExercises() {
	return db.select().from(exercises).orderBy(exercises.name);
}
