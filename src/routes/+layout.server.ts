import { getActiveGoal } from '$lib/server/repositories/goals';
import { listTrainingLocations } from '$lib/server/repositories/equipment';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
	const [goal, locations] = await Promise.all([getActiveGoal(), listTrainingLocations()]);
	const onboarded = Boolean(goal) && locations.length > 0;
	return { onboarded, isOnboardingRoute: url.pathname.startsWith('/onboarding') };
};
