import { getActiveGoal } from '$lib/server/repositories/goals';
import { listTrainingLocations, getDefaultLocation } from '$lib/server/repositories/equipment';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [goal, locations, defaultLocation] = await Promise.all([
		getActiveGoal(),
		listTrainingLocations(),
		getDefaultLocation()
	]);
	return { goal, locations, defaultLocationId: defaultLocation?.id ?? null };
};
