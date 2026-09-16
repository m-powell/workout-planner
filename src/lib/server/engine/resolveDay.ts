import type { DayTemplate, EquipmentContext, ExerciseRecord, GoalRepConfig, RestrictedTagSet, SlotDef } from './types';
import { selectExerciseForSlot } from './selectExercises';

export interface ResolvedSlotExercise {
	slot: SlotDef;
	exercise: ExerciseRecord | null;
	usedFallback: boolean;
	droppedReason?: string;
	targetSets: number;
	targetRepRangeLow: number;
	targetRepRangeHigh: number;
	targetRpe: number;
}

/** Cardio slots use the rep-range fields to represent target minutes, not reps. */
const CARDIO_MINUTES_LOW = 15;
const CARDIO_MINUTES_HIGH = 25;

function targetsForSlot(slot: SlotDef, goalConfig: GoalRepConfig) {
	if (slot.role === 'cardio') {
		return {
			targetSets: 1,
			targetRepRangeLow: CARDIO_MINUTES_LOW,
			targetRepRangeHigh: CARDIO_MINUTES_HIGH,
			targetRpe: Math.max(1, goalConfig.targetRpe - 1)
		};
	}
	return {
		targetSets: slot.role === 'compound' ? goalConfig.setsCompound : goalConfig.setsIsolation,
		targetRepRangeLow: goalConfig.repRangeLow,
		targetRepRangeHigh: goalConfig.repRangeHigh,
		targetRpe: goalConfig.targetRpe
	};
}

/**
 * Resolves every slot in a day template to a concrete exercise + targets, given the
 * current injury/equipment context. Shared by plan generation (initial template) and
 * session generation (re-validated at log time, since injuries/equipment can change
 * between when a plan was created and when a given session is actually performed).
 */
export function resolveDayExercises(
	day: DayTemplate,
	goalConfig: GoalRepConfig,
	exercisePool: ExerciseRecord[],
	restrictedTags: RestrictedTagSet,
	availableEquipment: EquipmentContext
): ResolvedSlotExercise[] {
	const usedIds = new Set<number>();
	const results: ResolvedSlotExercise[] = [];

	for (const slot of day.slots) {
		const { exercise, usedFallback, droppedReason } = selectExerciseForSlot(
			slot,
			exercisePool,
			restrictedTags,
			availableEquipment,
			usedIds
		);

		if (exercise) usedIds.add(exercise.id);

		results.push({
			slot,
			exercise,
			usedFallback,
			droppedReason,
			...targetsForSlot(slot, goalConfig)
		});
	}

	return results;
}
