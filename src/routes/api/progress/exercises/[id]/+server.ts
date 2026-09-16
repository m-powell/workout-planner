import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getExerciseHistory, getVolumeOverTime } from '$lib/server/repositories/progress';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'invalid exercise id');

	const [history, volume] = await Promise.all([getExerciseHistory(id), getVolumeOverTime(id)]);
	return json({ history, volume });
};
