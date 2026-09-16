import { getActivePlan } from '$lib/server/repositories/plans';
import { getActiveGoal } from '$lib/server/repositories/goals';
import { listTrainingLocations, getDefaultLocation } from '$lib/server/repositories/equipment';
import { listAllExercises } from '$lib/server/repositories/exercises';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [activePlanData, goal, locations, defaultLocation, allExercises] = await Promise.all([
		getActivePlan(),
		getActiveGoal(),
		listTrainingLocations(),
		getDefaultLocation(),
		listAllExercises()
	]);

	const exerciseById = new Map(allExercises.map((e) => [e.id, e]));

	return {
		activePlanData,
		goal,
		locations,
		defaultLocationId: defaultLocation?.id ?? null,
		exerciseById: Object.fromEntries(exerciseById)
	};
};
