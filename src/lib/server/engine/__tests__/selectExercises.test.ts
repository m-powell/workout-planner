import { describe, expect, it } from 'vitest';
import { selectExerciseForSlot } from '../selectExercises';
import type { ExerciseRecord, SlotDef } from '../types';

const benchPress: ExerciseRecord = {
	id: 1,
	name: 'Barbell Bench Press',
	category: 'compound',
	isBodyweightFallback: false,
	equipment: ['barbell'],
	tags: [
		{ name: 'horizontal_push', category: 'movement_pattern', stressLevel: 'primary' },
		{ name: 'chest', category: 'muscle', stressLevel: 'primary' },
		{ name: 'shoulder', category: 'joint', stressLevel: 'secondary' }
	]
};

const dbBenchPress: ExerciseRecord = {
	id: 2,
	name: 'Dumbbell Bench Press',
	category: 'compound',
	isBodyweightFallback: false,
	equipment: ['dumbbell'],
	tags: [
		{ name: 'horizontal_push', category: 'movement_pattern', stressLevel: 'primary' },
		{ name: 'chest', category: 'muscle', stressLevel: 'primary' },
		{ name: 'shoulder', category: 'joint', stressLevel: 'secondary' }
	]
};

const pushup: ExerciseRecord = {
	id: 3,
	name: 'Push-up',
	category: 'compound',
	isBodyweightFallback: true,
	equipment: ['bodyweight'],
	tags: [
		{ name: 'horizontal_push', category: 'movement_pattern', stressLevel: 'primary' },
		{ name: 'chest', category: 'muscle', stressLevel: 'primary' },
		{ name: 'shoulder', category: 'joint', stressLevel: 'secondary' }
	]
};

const pool = [benchPress, dbBenchPress, pushup];

const horizontalPushSlot: SlotDef = {
	targetTagName: 'horizontal_push',
	targetTagCategory: 'movement_pattern',
	role: 'compound'
};

describe('selectExerciseForSlot', () => {
	it('picks an equipment-available, non-restricted candidate', () => {
		const result = selectExerciseForSlot(horizontalPushSlot, pool, new Set(), new Set(['barbell', 'bodyweight']));
		expect(result.exercise?.id).toBe(1);
		expect(result.usedFallback).toBe(false);
	});

	it('falls back to another candidate when equipment is unavailable', () => {
		const result = selectExerciseForSlot(horizontalPushSlot, pool, new Set(), new Set(['dumbbell', 'bodyweight']));
		expect(result.exercise?.id).toBe(2);
	});

	it('excludes exercises tagged with a restricted (injured) joint', () => {
		const restricted = new Set(['joint:shoulder']);
		const result = selectExerciseForSlot(horizontalPushSlot, pool, restricted, new Set(['barbell', 'dumbbell', 'bodyweight']));
		expect(result.exercise).toBeNull();
		expect(result.droppedReason).toMatch(/injury-restricted/);
	});

	it('picks the bodyweight exercise directly (not via the fallback path) when it satisfies equipment normally', () => {
		const result = selectExerciseForSlot(horizontalPushSlot, pool, new Set(), new Set(['bodyweight']));
		expect(result.exercise?.id).toBe(3);
		expect(result.usedFallback).toBe(false);
	});

	it('reaches a fallback exercise tagged only SECONDARY for the slot when every primary-tagged match needs unavailable equipment', () => {
		const legPress: ExerciseRecord = {
			id: 10,
			name: 'Leg Press',
			category: 'compound',
			isBodyweightFallback: false,
			equipment: ['machine'],
			tags: [{ name: 'squat', category: 'movement_pattern', stressLevel: 'primary' }]
		};
		const wallSit: ExerciseRecord = {
			id: 11,
			name: 'Wall Sit',
			category: 'isolation',
			isBodyweightFallback: true,
			equipment: ['bodyweight'],
			tags: [{ name: 'squat', category: 'movement_pattern', stressLevel: 'secondary' }]
		};
		const squatSlot: SlotDef = { targetTagName: 'squat', targetTagCategory: 'movement_pattern', role: 'compound' };

		const result = selectExerciseForSlot(squatSlot, [legPress, wallSit], new Set(), new Set(['bodyweight']));
		expect(result.exercise?.id).toBe(11);
		expect(result.usedFallback).toBe(true);
	});

	it('avoids re-picking a recently used exercise when an alternative satisfies the slot', () => {
		const result = selectExerciseForSlot(
			horizontalPushSlot,
			pool,
			new Set(),
			new Set(['barbell', 'dumbbell', 'bodyweight']),
			new Set([1])
		);
		expect(result.exercise?.id).not.toBe(1);
	});

	it('drops the slot when no exercise in the library is tagged for it', () => {
		const obscureSlot: SlotDef = { targetTagName: 'nonexistent_pattern', targetTagCategory: 'movement_pattern', role: 'compound' };
		const result = selectExerciseForSlot(obscureSlot, pool, new Set(), new Set(['barbell', 'dumbbell', 'bodyweight']));
		expect(result.exercise).toBeNull();
		expect(result.droppedReason).toMatch(/no exercise tagged/);
	});
});
