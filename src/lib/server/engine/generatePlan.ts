import type { GoalType, ProgressionRule } from '../db/schema';
import { buildSplitTemplate, goalRepConfig } from './splitTemplates';
import { resolveDayExercises } from './resolveDay';
import type { EquipmentContext, ExerciseRecord, RestrictedTagSet } from './types';

export interface GeneratePlanInput {
	goalType: GoalType;
	daysPerWeek: number;
	exercisePool: ExerciseRecord[];
	restrictedTags: RestrictedTagSet;
	availableEquipment: EquipmentContext;
}

export interface GeneratedPlanExercise {
	orderIndex: number;
	exerciseId: number;
	targetSets: number;
	targetRepRangeLow: number;
	targetRepRangeHigh: number;
	targetRpe: number;
	progressionRule: ProgressionRule;
	isSubstitutable: boolean;
}

export interface GeneratedPlanDay {
	dayIndex: number;
	label: string;
	exercises: GeneratedPlanExercise[];
	warnings: string[];
}

export interface GeneratedPlan {
	splitType: string;
	daysPerWeek: number;
	days: GeneratedPlanDay[];
}

export function generatePlan(input: GeneratePlanInput): GeneratedPlan {
	const { goalType, daysPerWeek, exercisePool, restrictedTags, availableEquipment } = input;
	const template = buildSplitTemplate(daysPerWeek, goalType);
	const goalConfig = goalRepConfig[goalType];

	const days: GeneratedPlanDay[] = template.days.map((day, dayIndex) => {
		const resolved = resolveDayExercises(day, goalConfig, exercisePool, restrictedTags, availableEquipment);

		const exercises: GeneratedPlanExercise[] = [];
		const warnings: string[] = [];

		resolved.forEach((slot, orderIndex) => {
			if (!slot.exercise) {
				warnings.push(slot.droppedReason ?? `could not fill slot ${orderIndex} on ${day.label}`);
				return;
			}
			exercises.push({
				orderIndex,
				exerciseId: slot.exercise.id,
				targetSets: slot.targetSets,
				targetRepRangeLow: slot.targetRepRangeLow,
				targetRepRangeHigh: slot.targetRepRangeHigh,
				targetRpe: slot.targetRpe,
				progressionRule: 'double_progression',
				isSubstitutable: true
			});
		});

		return { dayIndex, label: day.label, exercises, warnings };
	});

	return { splitType: template.name, daysPerWeek, days };
}
