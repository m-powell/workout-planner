import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logSet } from '$lib/server/repositories/sessions';

export const POST: RequestHandler = async ({ params, request }) => {
	const sessionExerciseId = Number(params.id);
	if (!Number.isInteger(sessionExerciseId)) throw error(400, 'invalid session exercise id');

	const body = await request.json();
	if (!Number.isInteger(body.setIndex)) throw error(400, 'setIndex is required');
	if (!Number.isInteger(body.reps)) throw error(400, 'reps is required');

	const row = await logSet({
		sessionExerciseId,
		setIndex: body.setIndex,
		weight: body.weight ?? null,
		weightUnit: body.weightUnit ?? 'lb',
		reps: body.reps,
		rpe: body.rpe ?? null,
		isWarmup: Boolean(body.isWarmup),
		clientId: body.clientId
	});

	return json({ loggedSet: row }, { status: 201 });
};
