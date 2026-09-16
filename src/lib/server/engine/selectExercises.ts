import type { EquipmentContext, ExerciseRecord, RestrictedTagSet, SelectExerciseResult, SlotDef } from './types';
import { tagKey } from './types';

function matchesSlotTag(exercise: ExerciseRecord, slot: SlotDef, requirePrimary: boolean): boolean {
	return exercise.tags.some(
		(t) =>
			t.category === slot.targetTagCategory &&
			t.name === slot.targetTagName &&
			(!requirePrimary || t.stressLevel === 'primary')
	);
}

function isInjuryRestricted(exercise: ExerciseRecord, restrictedTags: RestrictedTagSet): boolean {
	return exercise.tags.some((t) => restrictedTags.has(tagKey(t.category, t.name)));
}

function equipmentSatisfied(exercise: ExerciseRecord, availableEquipment: EquipmentContext): boolean {
	return exercise.equipment.every((eq) => availableEquipment.has(eq));
}

function roleMatchesCategory(slot: SlotDef, exercise: ExerciseRecord): boolean {
	if (slot.role === 'cardio') return exercise.category === 'cardio';
	if (slot.role === 'compound') return exercise.category === 'compound';
	return exercise.category === 'isolation';
}

function rankCandidates(
	candidates: ExerciseRecord[],
	slot: SlotDef,
	recentlyUsedExerciseIds: ReadonlySet<number>
): ExerciseRecord[] {
	return [...candidates].sort((a, b) => {
		const roleDelta = Number(!roleMatchesCategory(slot, a)) - Number(!roleMatchesCategory(slot, b));
		if (roleDelta !== 0) return roleDelta;

		const recentDelta =
			Number(recentlyUsedExerciseIds.has(a.id)) - Number(recentlyUsedExerciseIds.has(b.id));
		if (recentDelta !== 0) return recentDelta;

		return a.id - b.id;
	});
}

/**
 * Picks the best exercise for a template slot given the current injury and equipment
 * context. Falls back to a guaranteed no-equipment substitute (isBodyweightFallback)
 * when nothing in the normal pool clears both filters; drops the slot only if even the
 * fallback is injury-restricted.
 */
export function selectExerciseForSlot(
	slot: SlotDef,
	exercisePool: ExerciseRecord[],
	restrictedTags: RestrictedTagSet,
	availableEquipment: EquipmentContext,
	recentlyUsedExerciseIds: ReadonlySet<number> = new Set()
): SelectExerciseResult {
	const taggedPrimary = exercisePool.filter((e) => matchesSlotTag(e, slot, true));
	const taggedAny = exercisePool.filter((e) => matchesSlotTag(e, slot, false));
	const taggedForRanking = taggedPrimary.length > 0 ? taggedPrimary : taggedAny;

	if (taggedAny.length === 0) {
		return { exercise: null, usedFallback: false, droppedReason: `no exercise tagged for ${slot.targetTagCategory}:${slot.targetTagName}` };
	}

	const safeForRanking = taggedForRanking.filter((e) => !isInjuryRestricted(e, restrictedTags));
	const safeAndEquipped = safeForRanking.filter((e) => equipmentSatisfied(e, availableEquipment));

	if (safeAndEquipped.length > 0) {
		const [best] = rankCandidates(safeAndEquipped, slot, recentlyUsedExerciseIds);
		return { exercise: best, usedFallback: false };
	}

	// Search the full (primary-or-secondary) tagged pool for the guaranteed fallback —
	// a fallback exercise tagged only secondary for this slot must still be reachable
	// even when other, equipment-requiring exercises match it as a primary tag.
	const safeAny = taggedAny.filter((e) => !isInjuryRestricted(e, restrictedTags));
	const fallbackPool = safeAny.filter((e) => e.isBodyweightFallback);
	if (fallbackPool.length > 0) {
		const [best] = rankCandidates(fallbackPool, slot, recentlyUsedExerciseIds);
		return { exercise: best, usedFallback: true };
	}

	if (safeAny.length === 0) {
		return {
			exercise: null,
			usedFallback: false,
			droppedReason: `all exercises for ${slot.targetTagCategory}:${slot.targetTagName} are injury-restricted`
		};
	}

	return {
		exercise: null,
		usedFallback: false,
		droppedReason: `no equipment-available or fallback exercise for ${slot.targetTagCategory}:${slot.targetTagName}`
	};
}
