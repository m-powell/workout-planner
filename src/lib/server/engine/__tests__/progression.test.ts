import { describe, expect, it } from 'vitest';
import { computeNextTarget, defaultWeightIncrement, type SetPerformance } from '../progression';

function sets(...reps: number[]): SetPerformance[] {
	return reps.map((r) => ({ reps: r, rpe: 8, weight: 100, isWarmup: false }));
}

describe('computeNextTarget', () => {
	const base = {
		currentTargetWeight: 100,
		repRangeLow: 8,
		repRangeHigh: 12,
		targetRpe: 8,
		weightIncrement: 5
	};

	it('holds target when there is no prior session history', () => {
		const result = computeNextTarget({ ...base, lastSessionSets: [] });
		expect(result.nextTargetWeight).toBe(100);
		expect(result.nextRepRangeLow).toBe(8);
		expect(result.nextRepRangeHigh).toBe(12);
	});

	it('increases weight and resets reps when every set hits the top of the range under RPE cap', () => {
		const result = computeNextTarget({ ...base, lastSessionSets: sets(12, 12, 12) });
		expect(result.nextTargetWeight).toBe(105);
		expect(result.nextRepRangeLow).toBe(8);
		expect(result.nextRepRangeHigh).toBe(12);
	});

	it('does NOT increase weight if RPE exceeded the buffer even when reps hit the top', () => {
		const overRpeSets: SetPerformance[] = [
			{ reps: 12, rpe: 9.5, weight: 100, isWarmup: false },
			{ reps: 12, rpe: 9.5, weight: 100, isWarmup: false }
		];
		const result = computeNextTarget({ ...base, lastSessionSets: overRpeSets });
		expect(result.nextTargetWeight).toBeLessThanOrEqual(100);
	});

	it('holds weight when within range but below the top', () => {
		const result = computeNextTarget({ ...base, lastSessionSets: sets(9, 10, 9) });
		expect(result.nextTargetWeight).toBe(100);
		expect(result.nextRepRangeLow).toBe(8);
		expect(result.nextRepRangeHigh).toBe(12);
	});

	it('holds weight (does not increase) when a set falls below the rep-range floor', () => {
		const result = computeNextTarget({ ...base, lastSessionSets: sets(6, 10, 9) });
		expect(result.nextTargetWeight).toBe(100);
	});

	it('steps weight down when RPE is well above target and reps missed the floor', () => {
		const failedHardSets: SetPerformance[] = [
			{ reps: 5, rpe: 10, weight: 100, isWarmup: false },
			{ reps: 4, rpe: 10, weight: 100, isWarmup: false }
		];
		const result = computeNextTarget({ ...base, lastSessionSets: failedHardSets });
		expect(result.nextTargetWeight).toBe(100 - 5 / 2);
	});

	it('never drops weight below zero', () => {
		const failedHardSets: SetPerformance[] = [{ reps: 1, rpe: 10, weight: 2, isWarmup: false }];
		const result = computeNextTarget({
			...base,
			currentTargetWeight: 2,
			weightIncrement: 5,
			lastSessionSets: failedHardSets
		});
		expect(result.nextTargetWeight).toBe(0);
	});

	it('ignores warmup sets entirely', () => {
		const withWarmup: SetPerformance[] = [
			{ reps: 20, rpe: 3, weight: 45, isWarmup: true },
			{ reps: 9, rpe: 8, weight: 100, isWarmup: false },
			{ reps: 10, rpe: 8, weight: 100, isWarmup: false }
		];
		const result = computeNextTarget({ ...base, lastSessionSets: withWarmup });
		// within range, not at top -> hold, unaffected by the warmup set's high reps/low RPE
		expect(result.nextTargetWeight).toBe(100);
	});

	it('for bodyweight exercises (no tracked weight), raises the rep range instead of weight', () => {
		const result = computeNextTarget({
			...base,
			currentTargetWeight: null,
			lastSessionSets: sets(12, 12, 12)
		});
		expect(result.nextTargetWeight).toBeNull();
		expect(result.nextRepRangeLow).toBe(9);
		expect(result.nextRepRangeHigh).toBe(13);
	});
});

describe('defaultWeightIncrement', () => {
	it('gives lower-body compound lifts the biggest step', () => {
		expect(defaultWeightIncrement('compound', 'squat')).toBe(10);
		expect(defaultWeightIncrement('compound', 'hinge')).toBe(10);
	});

	it('gives upper-body compound lifts a moderate step', () => {
		expect(defaultWeightIncrement('compound', 'horizontal_push')).toBe(5);
	});

	it('gives isolation work the smallest step', () => {
		expect(defaultWeightIncrement('isolation', null)).toBe(2.5);
	});

	it('gives cardio no weight step', () => {
		expect(defaultWeightIncrement('cardio', 'cardio')).toBe(0);
	});
});
