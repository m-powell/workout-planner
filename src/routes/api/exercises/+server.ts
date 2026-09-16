import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listAllExercises } from '$lib/server/repositories/exercises';

export const GET: RequestHandler = async () => {
	const exercises = await listAllExercises();
	return json({ exercises });
};
