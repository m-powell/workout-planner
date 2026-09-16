import { error } from '@sveltejs/kit';
import { getExerciseHistory, getVolumeOverTime } from '$lib/server/repositories/progress';
import { getExerciseById } from '$lib/server/repositories/exercises';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const exerciseId = Number(params.exerciseId);
	if (!Number.isInteger(exerciseId)) throw error(400, 'invalid exercise id');

	const [exercise, history, volume] = await Promise.all([
		getExerciseById(exerciseId),
		getExerciseHistory(exerciseId),
		getVolumeOverTime(exerciseId)
	]);
	if (!exercise) throw error(404, 'exercise not found');

	return { exercise, history, volume };
};
