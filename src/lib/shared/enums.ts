// Enum value-lists shared between server (Drizzle schema) and client (form pickers).
// Kept outside $lib/server so client code can import them directly.

export const goalTypeValues = ['strength', 'hypertrophy', 'endurance', 'weight_loss', 'event'] as const;
export type GoalType = (typeof goalTypeValues)[number];

export const equipmentCategoryValues = [
	'barbell',
	'dumbbell',
	'kettlebell',
	'machine',
	'cable',
	'bodyweight',
	'band',
	'cardio',
	'other'
] as const;
export type EquipmentCategory = (typeof equipmentCategoryValues)[number];

export const injurySeverityValues = ['mild', 'moderate', 'severe'] as const;
export type InjurySeverity = (typeof injurySeverityValues)[number];

export const tagCategoryValues = ['muscle', 'joint', 'movement_pattern'] as const;
export type TagCategory = (typeof tagCategoryValues)[number];

export const goalTypeLabels: Record<GoalType, string> = {
	strength: 'Strength',
	hypertrophy: 'Hypertrophy (muscle growth)',
	endurance: 'Endurance',
	weight_loss: 'Weight loss',
	event: 'Event / event training'
};

export const equipmentCategoryLabels: Record<EquipmentCategory, string> = {
	barbell: 'Barbell',
	dumbbell: 'Dumbbells',
	kettlebell: 'Kettlebell',
	machine: 'Machines',
	cable: 'Cable stack',
	bodyweight: 'Bodyweight only',
	band: 'Resistance bands',
	cardio: 'Cardio machine (treadmill/bike/rower)',
	other: 'Pull-up bar / other'
};
