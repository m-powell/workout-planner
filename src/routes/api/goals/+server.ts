import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createGoal, getActiveGoal } from '$lib/server/repositories/goals';
import { goalTypeValues } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const goal = await getActiveGoal();
	return json({ goal });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!goalTypeValues.includes(body.type)) throw error(400, `type must be one of ${goalTypeValues.join(', ')}`);
	if (!body.daysPerWeek || body.daysPerWeek < 1 || body.daysPerWeek > 6) {
		throw error(400, 'daysPerWeek must be between 1 and 6');
	}

	const goal = await createGoal({
		type: body.type,
		label: body.label,
		targetEventDate: body.targetEventDate ?? null,
		targetTimeframeWeeks: body.targetTimeframeWeeks ?? null,
		daysPerWeek: body.daysPerWeek
	});

	return json({ goal }, { status: 201 });
};
