import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateAndSavePlan, getActivePlan } from '$lib/server/repositories/plans';

export const GET: RequestHandler = async () => {
	const active = await getActivePlan();
	return json({ activePlan: active });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!Number.isInteger(body.goalId)) throw error(400, 'goalId is required');
	if (!Number.isInteger(body.locationId)) throw error(400, 'locationId is required');

	const result = await generateAndSavePlan(body.goalId, body.locationId);
	return json(result, { status: 201 });
};
