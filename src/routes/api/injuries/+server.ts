import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createInjury, listAllInjuries } from '$lib/server/repositories/injuries';
import { injurySeverityValues } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const injuries = await listAllInjuries();
	return json({ injuries });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body.bodyArea || typeof body.bodyArea !== 'string') throw error(400, 'bodyArea is required');
	if (body.severity && !injurySeverityValues.includes(body.severity)) throw error(400, 'invalid severity');
	if (!Array.isArray(body.tagNames)) throw error(400, 'tagNames must be an array of {name, category}');

	const injury = await createInjury({
		bodyArea: body.bodyArea,
		conditionLabel: body.conditionLabel,
		severity: body.severity ?? 'moderate',
		isChronic: Boolean(body.isChronic),
		startedAt: body.startedAt,
		expectedRecoveryDate: body.expectedRecoveryDate ?? null,
		notes: body.notes,
		tagNames: body.tagNames
	});

	return json({ injury }, { status: 201 });
};
