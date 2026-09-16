import type { GoalType } from '../db/schema';
import type { DayTemplate, GoalRepConfig, SplitTemplate, SlotDef } from './types';

const c = (targetTagName: string, targetTagCategory: SlotDef['targetTagCategory'] = 'movement_pattern'): SlotDef => ({
	targetTagName,
	targetTagCategory,
	role: 'compound'
});
const iso = (targetTagName: string): SlotDef => ({
	targetTagName,
	targetTagCategory: 'muscle',
	role: 'isolation'
});
const cardio = (): SlotDef => ({ targetTagName: 'cardio', targetTagCategory: 'movement_pattern', role: 'cardio' });

const fullBodyA: DayTemplate = {
	label: 'Full Body A',
	slots: [c('squat'), c('horizontal_push'), c('horizontal_pull'), c('hinge'), iso('abs')]
};
const fullBodyB: DayTemplate = {
	label: 'Full Body B',
	slots: [c('lunge'), c('vertical_push'), c('vertical_pull'), c('hinge'), iso('obliques')]
};
const fullBodyC: DayTemplate = {
	label: 'Full Body C',
	slots: [c('squat'), c('vertical_push'), c('horizontal_pull'), c('carry'), iso('abs')]
};

const upperA: DayTemplate = {
	label: 'Upper A',
	slots: [c('horizontal_push'), c('horizontal_pull'), c('vertical_push'), c('vertical_pull'), iso('biceps'), iso('triceps')]
};
const lowerA: DayTemplate = {
	label: 'Lower A',
	slots: [c('squat'), c('hinge'), c('lunge'), iso('calves'), iso('abs')]
};
const upperB: DayTemplate = {
	label: 'Upper B',
	slots: [c('vertical_push'), c('vertical_pull'), c('horizontal_push'), c('horizontal_pull'), iso('shoulders'), iso('triceps')]
};
const lowerB: DayTemplate = {
	label: 'Lower B',
	slots: [c('hinge'), c('squat'), c('lunge'), iso('calves'), iso('obliques')]
};

const push: DayTemplate = {
	label: 'Push',
	slots: [c('horizontal_push'), c('vertical_push'), iso('chest'), iso('shoulders'), iso('triceps')]
};
const pull: DayTemplate = {
	label: 'Pull',
	slots: [c('horizontal_pull'), c('vertical_pull'), iso('rear_delts'), iso('biceps'), iso('forearms')]
};
const legs: DayTemplate = {
	label: 'Legs',
	slots: [c('squat'), c('hinge'), c('lunge'), iso('calves'), iso('abs')]
};

/** Deterministic (days_per_week -> split) lookup, independent of goal. */
function baseSplitForDays(daysPerWeek: number): DayTemplate[] {
	if (daysPerWeek <= 1) return [fullBodyA];
	if (daysPerWeek === 2) return [fullBodyA, fullBodyB];
	if (daysPerWeek === 3) return [fullBodyA, fullBodyB, fullBodyC];
	if (daysPerWeek === 4) return [upperA, lowerA, upperB, lowerB];
	if (daysPerWeek === 5) return [push, pull, legs, upperA, lowerA];
	return [push, pull, legs, push, pull, legs].slice(0, daysPerWeek);
}

/**
 * Builds the day/slot structure for a goal + training frequency. Goal type biases
 * emphasis: strength drops isolation slots in favor of compounds; endurance/weight-loss
 * append a conditioning (cardio) slot to each day. Hypertrophy uses the base template as-is.
 */
export function buildSplitTemplate(daysPerWeek: number, goalType: GoalType): SplitTemplate {
	const base = baseSplitForDays(daysPerWeek);
	const clamped = Math.max(1, Math.min(daysPerWeek, 6));
	const name = `${clamped}-day ${base === baseSplitForDays(clamped) ? '' : ''}${clamped <= 3 ? 'Full Body' : clamped === 4 ? 'Upper/Lower' : 'Push/Pull/Legs'}`.trim();

	const days = base.map((day) => {
		let slots = [...day.slots];

		if (goalType === 'strength') {
			// favor fewer, heavier compound slots
			slots = slots.filter((s) => s.role !== 'isolation').concat(slots.filter((s) => s.role === 'isolation').slice(0, 1));
		}

		if (goalType === 'endurance' || goalType === 'weight_loss') {
			slots = [...slots, cardio()];
		}

		return { label: day.label, slots };
	});

	return { name, days };
}

export const goalRepConfig: Record<GoalType, GoalRepConfig> = {
	strength: { repRangeLow: 3, repRangeHigh: 6, targetRpe: 8.5, setsCompound: 4, setsIsolation: 3, restSeconds: 180 },
	hypertrophy: { repRangeLow: 8, repRangeHigh: 12, targetRpe: 8, setsCompound: 3, setsIsolation: 3, restSeconds: 90 },
	endurance: { repRangeLow: 12, repRangeHigh: 20, targetRpe: 7, setsCompound: 3, setsIsolation: 2, restSeconds: 60 },
	weight_loss: { repRangeLow: 10, repRangeHigh: 15, targetRpe: 7.5, setsCompound: 3, setsIsolation: 2, restSeconds: 60 },
	event: { repRangeLow: 6, repRangeHigh: 10, targetRpe: 8, setsCompound: 3, setsIsolation: 2, restSeconds: 90 }
};
