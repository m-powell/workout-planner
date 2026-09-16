import { describe, expect, it } from 'vitest';
import { generatePlan } from '../generatePlan';
import { exerciseDefs } from '../../db/seed/exercises';
import type { EquipmentCategory, GoalType } from '../../db/schema';
import type { ExerciseRecord } from '../types';
import { tagKey } from '../types';

// Build an in-memory exercise pool from the real seed data, giving every exercise a
// stable id so this test exercises the engine against the actual library shape.
const exercisePool: ExerciseRecord[] = exerciseDefs.map((def, i) => ({
	id: i + 1,
	name: def.name,
	category: def.category,
	isBodyweightFallback: def.isBodyweightFallback ?? false,
	equipment: def.equipment,
	tags: def.tags
}));

const allEquipment = new Set<EquipmentCategory>([
	'barbell',
	'dumbbell',
	'kettlebell',
	'machine',
	'cable',
	'bodyweight',
	'band',
	'cardio',
	'other'
]);

const goalTypes: GoalType[] = ['strength', 'hypertrophy', 'endurance', 'weight_loss', 'event'];

describe('generatePlan against the real seed library', () => {
	it.each(goalTypes)('fills every slot with no warnings for %s at every day count with full equipment', (goalType) => {
		for (let daysPerWeek = 1; daysPerWeek <= 6; daysPerWeek++) {
			const plan = generatePlan({
				goalType,
				daysPerWeek,
				exercisePool,
				restrictedTags: new Set(),
				availableEquipment: allEquipment
			});

			expect(plan.days).toHaveLength(daysPerWeek);
			for (const day of plan.days) {
				expect(day.warnings).toEqual([]);
				expect(day.exercises.length).toBeGreaterThan(0);
			}
		}
	});

	it('falls back to bodyweight-only exercises when no equipment is available, still filling every slot', () => {
		const plan = generatePlan({
			goalType: 'hypertrophy',
			daysPerWeek: 3,
			exercisePool,
			restrictedTags: new Set(),
			availableEquipment: new Set(['bodyweight'])
		});

		for (const day of plan.days) {
			expect(day.warnings).toEqual([]);
			for (const ex of day.exercises) {
				const record = exercisePool.find((e) => e.id === ex.exerciseId)!;
				expect(record.equipment.every((eq) => eq === 'bodyweight')).toBe(true);
			}
		}
	});

	it('avoids every exercise tagged with a restricted shoulder joint', () => {
		const restrictedTags = new Set([tagKey('joint', 'shoulder')]);
		const plan = generatePlan({
			goalType: 'strength',
			daysPerWeek: 4,
			exercisePool,
			restrictedTags,
			availableEquipment: allEquipment
		});

		for (const day of plan.days) {
			for (const ex of day.exercises) {
				const record = exercisePool.find((e) => e.id === ex.exerciseId)!;
				const hasRestrictedTag = record.tags.some((t) => t.category === 'joint' && t.name === 'shoulder');
				expect(hasRestrictedTag).toBe(false);
			}
		}
	});

	it('biases strength plans toward fewer isolation slots than hypertrophy plans', () => {
		const strengthPlan = generatePlan({
			goalType: 'strength',
			daysPerWeek: 4,
			exercisePool,
			restrictedTags: new Set(),
			availableEquipment: allEquipment
		});
		const hypertrophyPlan = generatePlan({
			goalType: 'hypertrophy',
			daysPerWeek: 4,
			exercisePool,
			restrictedTags: new Set(),
			availableEquipment: allEquipment
		});

		const countIsolation = (days: typeof strengthPlan.days) =>
			days.reduce(
				(sum, day) =>
					sum +
					day.exercises.filter((ex) => exercisePool.find((e) => e.id === ex.exerciseId)?.category === 'isolation')
						.length,
				0
			);

		expect(countIsolation(strengthPlan.days)).toBeLessThan(countIsolation(hypertrophyPlan.days));
	});
});
