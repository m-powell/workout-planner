import type { TagCategory } from '../schema';

export interface TagDef {
	name: string;
	category: TagCategory;
}

export const muscleTags = [
	'chest',
	'back',
	'lats',
	'traps',
	'rear_delts',
	'shoulders',
	'biceps',
	'triceps',
	'forearms',
	'quads',
	'hamstrings',
	'glutes',
	'calves',
	'abs',
	'obliques',
	'lower_back',
	'full_body'
] as const;

export const jointTags = ['shoulder', 'elbow', 'wrist', 'spine', 'hip', 'knee', 'ankle'] as const;

export const movementPatternTags = [
	'horizontal_push',
	'vertical_push',
	'horizontal_pull',
	'vertical_pull',
	'squat',
	'hinge',
	'lunge',
	'carry',
	'core_brace',
	'rotation',
	'calf_raise',
	'cardio',
	'mobility'
] as const;

export const allTags: TagDef[] = [
	...muscleTags.map((name) => ({ name, category: 'muscle' as const })),
	...jointTags.map((name) => ({ name, category: 'joint' as const })),
	...movementPatternTags.map((name) => ({ name, category: 'movement_pattern' as const }))
];
