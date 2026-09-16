import type { GoalType, SessionExerciseSource } from '../db/schema';
import { buildSplitTemplate, goalRepConfig } from './splitTemplates';
import { resolveDayExercises } from './resolveDay';
import { computeNextTarget, defaultWeightIncrement, type SetPerformance } from './progression';
import type { EquipmentContext, ExerciseRecord, RestrictedTagSet } from './types';

export interface GenerateSessionInput {
	goalType: GoalType;
	daysPerWeek: number;
	dayIndex: number;
	exercisePool: ExerciseRecord[];
	restrictedTags: RestrictedTagSet;
	availableEquipment: EquipmentContext;
	/** most recent completed session's working sets, keyed by exercise id */
	historyByExerciseId: ReadonlyMap<number, SetPerformance[]>;
	/** last known working weight, keyed by exercise id (from exercise_progression_state cache) */
	currentTargetWeightByExerciseId: ReadonlyMap<number, number | null>;
	/** exercise ids used in the plan template, to detect a mid-plan substitution */
	planExerciseIdsByOrderIndex: ReadonlyMap<number, number>;
}

export interface GeneratedSessionExercise {
	orderIndex: number;
	exerciseId: number;
	source: SessionExerciseSource;
	replacedPlanExerciseIndex: number | null;
	targetSets: number;
	targetRepRangeLow: number;
	targetRepRangeHigh: number;
	targetRpe: number;
	targetWeight: number | null;
	rationale: string;
}

export interface GeneratedSession {
	label: string;
	exercises: GeneratedSessionExercise[];
	warnings: string[];
}

function primaryMovementPattern(exercise: ExerciseRecord): string | null {
	const primary = exercise.tags.find((t) => t.category === 'movement_pattern' && t.stressLevel === 'primary');
	return primary?.name ?? null;
}

/**
 * Re-validates today's slots against the current injury/equipment context (which may
 * have changed since the plan was created) and computes each exercise's next target
 * weight/reps from the last time it was performed via the progression rule.
 */
export function generateSession(input: GenerateSessionInput): GeneratedSession {
	const {
		goalType,
		daysPerWeek,
		dayIndex,
		exercisePool,
		restrictedTags,
		availableEquipment,
		historyByExerciseId,
		currentTargetWeightByExerciseId,
		planExerciseIdsByOrderIndex
	} = input;

	const template = buildSplitTemplate(daysPerWeek, goalType);
	const day = template.days[dayIndex];
	if (!day) throw new Error(`dayIndex ${dayIndex} out of range for a ${daysPerWeek}-day split`);

	const goalConfig = goalRepConfig[goalType];
	const resolved = resolveDayExercises(day, goalConfig, exercisePool, restrictedTags, availableEquipment);

	const exercises: GeneratedSessionExercise[] = [];
	const warnings: string[] = [];

	resolved.forEach((slot, orderIndex) => {
		if (!slot.exercise) {
			warnings.push(slot.droppedReason ?? `could not fill slot ${orderIndex} on ${day.label}`);
			return;
		}

		const exercise = slot.exercise;
		const plannedExerciseId = planExerciseIdsByOrderIndex.get(orderIndex);
		const wasSubstituted = plannedExerciseId != null && plannedExerciseId !== exercise.id;

		const lastSessionSets = historyByExerciseId.get(exercise.id) ?? [];
		const currentTargetWeight = currentTargetWeightByExerciseId.get(exercise.id) ?? null;
		const weightIncrement = defaultWeightIncrement(
			exercise.category === 'cardio' ? 'cardio' : exercise.category === 'isolation' ? 'isolation' : 'compound',
			primaryMovementPattern(exercise)
		);

		const progression = computeNextTarget({
			lastSessionSets,
			currentTargetWeight,
			repRangeLow: slot.targetRepRangeLow,
			repRangeHigh: slot.targetRepRangeHigh,
			targetRpe: slot.targetRpe,
			weightIncrement
		});

		exercises.push({
			orderIndex,
			exerciseId: exercise.id,
			source: wasSubstituted ? 'swapped' : 'from_plan',
			replacedPlanExerciseIndex: wasSubstituted ? orderIndex : null,
			targetSets: slot.targetSets,
			targetRepRangeLow: progression.nextRepRangeLow,
			targetRepRangeHigh: progression.nextRepRangeHigh,
			targetRpe: slot.targetRpe,
			targetWeight: progression.nextTargetWeight,
			rationale: wasSubstituted
				? `${progression.rationale} (substituted due to current injury/equipment constraints)`
				: progression.rationale
		});
	});

	return { label: day.label, exercises, warnings };
}

export type { SetPerformance };
