import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createTrainingLocation, listTrainingLocations } from '$lib/server/repositories/equipment';
import { equipmentCategoryValues } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const locations = await listTrainingLocations();
	return json({ locations });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body.name || typeof body.name !== 'string') throw error(400, 'name is required');
	const categories = Array.isArray(body.categories) ? body.categories : [];
	for (const c of categories) {
		if (!equipmentCategoryValues.includes(c)) throw error(400, `invalid equipment category: ${c}`);
	}

	const location = await createTrainingLocation(body.name, categories, Boolean(body.isDefault));
	return json({ location }, { status: 201 });
};
