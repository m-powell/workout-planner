export interface SetPerformance {
	reps: number;
	rpe: number | null;
	weight: number | null;
	isWarmup: boolean;
}

export interface ProgressionInput {
	/** working sets (isWarmup=false) logged in the most recent completed session for this exercise, if any */
	lastSessionSets: SetPerformance[];
	currentTargetWeight: number | null;
	repRangeLow: number;
	repRangeHigh: number;
	targetRpe: number;
	/** weight step to apply on a successful progression; ignored for null-weight (bodyweight) exercises */
	weightIncrement: number;
}

export interface ProgressionResult {
	nextTargetWeight: number | null;
	nextRepRangeLow: number;
	nextRepRangeHigh: number;
	rationale: string;
}

const RPE_BUFFER = 0.5;
const RPE_OVERSHOOT = 1;

const LOWER_BODY_COMPOUND_PATTERNS = new Set(['squat', 'hinge', 'lunge']);

/** Heavier compound lower-body lifts progress in bigger steps than upper-body or isolation work. */
export function defaultWeightIncrement(exerciseCategory: 'compound' | 'isolation' | 'cardio', primaryMovementPattern: string | null): number {
	if (exerciseCategory === 'cardio') return 0;
	if (exerciseCategory === 'compound' && primaryMovementPattern && LOWER_BODY_COMPOUND_PATTERNS.has(primaryMovementPattern)) {
		return 10;
	}
	if (exerciseCategory === 'compound') return 5;
	return 2.5;
}

/**
 * Pure double-progression rule: once every working set hits the top of the rep range
 * at/under the target RPE, increase load (or, for bodyweight exercises with no tracked
 * weight, raise the rep range) and reset to the bottom of the range. Otherwise hold and
 * let the lifter chase more reps at the same load, or step down one increment if RPE
 * significantly exceeded target with reps still short of the range. A manual override by
 * the user (a different currentTargetWeight than this function last produced) always wins
 * because callers pass in currentTargetWeight fresh from the DB each time.
 */
export function computeNextTarget(input: ProgressionInput): ProgressionResult {
	const { lastSessionSets, currentTargetWeight, repRangeLow, repRangeHigh, targetRpe, weightIncrement } = input;

	const workingSets = lastSessionSets.filter((s) => !s.isWarmup);

	if (workingSets.length === 0) {
		return {
			nextTargetWeight: currentTargetWeight,
			nextRepRangeLow: repRangeLow,
			nextRepRangeHigh: repRangeHigh,
			rationale: 'no prior session data — using starting target'
		};
	}

	const rpeValues = workingSets.map((s) => s.rpe).filter((v): v is number => v != null);
	const avgRpe = rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : null;

	const allMetTop = workingSets.every((s) => s.reps >= repRangeHigh);
	const underRpeCap = avgRpe === null || avgRpe <= targetRpe + RPE_BUFFER;
	const anyBelowLow = workingSets.some((s) => s.reps < repRangeLow);
	const overRpe = avgRpe !== null && avgRpe > targetRpe + RPE_OVERSHOOT;

	if (allMetTop && underRpeCap) {
		if (currentTargetWeight != null) {
			return {
				nextTargetWeight: currentTargetWeight + weightIncrement,
				nextRepRangeLow: repRangeLow,
				nextRepRangeHigh: repRangeHigh,
				rationale: `hit ${repRangeHigh}+ reps on all sets under target RPE — increasing load`
			};
		}
		return {
			nextTargetWeight: null,
			nextRepRangeLow: repRangeLow + 1,
			nextRepRangeHigh: repRangeHigh + 1,
			rationale: `hit ${repRangeHigh}+ reps on all sets under target RPE — raising rep target (no tracked weight)`
		};
	}

	if (anyBelowLow || overRpe) {
		if (currentTargetWeight != null && overRpe) {
			return {
				nextTargetWeight: Math.max(0, currentTargetWeight - weightIncrement / 2),
				nextRepRangeLow: repRangeLow,
				nextRepRangeHigh: repRangeHigh,
				rationale: 'RPE well above target — easing load back'
			};
		}
		return {
			nextTargetWeight: currentTargetWeight,
			nextRepRangeLow: repRangeLow,
			nextRepRangeHigh: repRangeHigh,
			rationale: 'missed rep-range floor — holding load, repeat range'
		};
	}

	return {
		nextTargetWeight: currentTargetWeight,
		nextRepRangeLow: repRangeLow,
		nextRepRangeHigh: repRangeHigh,
		rationale: 'within rep range, under target reps — holding load, chase more reps'
	};
}
