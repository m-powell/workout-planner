import { getInProgressSession } from '$lib/server/repositories/sessions';
import { getActivePlan, getNextPlanDayIndex } from '$lib/server/repositories/plans';
import { listTrainingLocations, getDefaultLocation } from '$lib/server/repositories/equipment';
import { listAllExercises } from '$lib/server/repositories/exercises';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [inProgressSession, activePlanData, locations, defaultLocation, allExercises] = await Promise.all([
		getInProgressSession(),
		getActivePlan(),
		listTrainingLocations(),
		getDefaultLocation(),
		listAllExercises()
	]);

	let upcomingDay: { label: string; exerciseNames: string[] } | null = null;
	if (activePlanData && !inProgressSession) {
		const dayIndex = await getNextPlanDayIndex(activePlanData.plan.id, activePlanData.plan.daysPerWeek);
		const day = activePlanData.days.find((d) => d.dayIndex === dayIndex);
		if (day) {
			const exerciseById = new Map(allExercises.map((e) => [e.id, e.name]));
			upcomingDay = {
				label: day.label,
				exerciseNames: day.exercises.map((e) => exerciseById.get(e.exerciseId) ?? 'Exercise')
			};
		}
	}

	let sessionLabel = 'Workout';
	if (inProgressSession && activePlanData) {
		const day = activePlanData.days.find((d) => d.id === inProgressSession.session.planDayId);
		if (day) sessionLabel = day.label;
	}

	return {
		inProgressSession,
		sessionLabel,
		upcomingDay,
		locations,
		defaultLocationId: defaultLocation?.id ?? null,
		allExercises
	};
};
