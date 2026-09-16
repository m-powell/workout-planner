import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { swapSessionExercise } from '$lib/server/repositories/sessions';

export const POST: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'invalid session exercise id');
	const body = await request.json();
	if (!Number.isInteger(body.newExerciseId)) throw error(400, 'newExerciseId is required');

	await swapSessionExercise(id, body.newExerciseId);
	return json({ ok: true });
};
