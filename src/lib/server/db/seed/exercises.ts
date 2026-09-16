import type { EquipmentCategory, ExerciseCategory, StressLevel, TagCategory } from '../schema';

export interface ExerciseTagDef {
	name: string;
	category: TagCategory;
	stressLevel: StressLevel;
}

export interface ExerciseDef {
	name: string;
	category: ExerciseCategory;
	defaultUnit: 'lb' | 'kg' | 'bodyweight';
	isUnilateral?: boolean;
	isBodyweightFallback?: boolean;
	instructions?: string;
	/** equipment categories required to perform this exercise */
	equipment: EquipmentCategory[];
	tags: ExerciseTagDef[];
}

const m = (name: string, stressLevel: StressLevel = 'primary'): ExerciseTagDef => ({
	name,
	category: 'muscle',
	stressLevel
});
const j = (name: string, stressLevel: StressLevel = 'secondary'): ExerciseTagDef => ({
	name,
	category: 'joint',
	stressLevel
});
const p = (name: string, stressLevel: StressLevel = 'primary'): ExerciseTagDef => ({
	name,
	category: 'movement_pattern',
	stressLevel
});

export const exerciseDefs: ExerciseDef[] = [
	// ---- Horizontal push ----
	{
		name: 'Push-up',
		category: 'compound',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('horizontal_push'), m('chest'), m('triceps', 'secondary'), j('shoulder'), j('wrist')]
	},
	{
		name: 'Barbell Bench Press',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['barbell'],
		tags: [p('horizontal_push'), m('chest'), m('triceps', 'secondary'), j('shoulder'), j('elbow')]
	},
	{
		name: 'Dumbbell Bench Press',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [p('horizontal_push'), m('chest'), m('triceps', 'secondary'), j('shoulder'), j('elbow')]
	},
	{
		name: 'Incline Dumbbell Press',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [p('horizontal_push'), m('chest'), m('shoulders', 'secondary'), j('shoulder')]
	},
	{
		name: 'Machine Chest Press',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['machine'],
		tags: [p('horizontal_push'), m('chest'), m('triceps', 'secondary'), j('shoulder')]
	},
	{
		name: 'Dumbbell Chest Fly',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [m('chest'), j('shoulder')]
	},

	// ---- Vertical push ----
	{
		name: 'Pike Push-up',
		category: 'compound',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('vertical_push'), m('shoulders'), m('triceps', 'secondary'), j('shoulder')]
	},
	{
		name: 'Overhead Barbell Press',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['barbell'],
		tags: [p('vertical_push'), m('shoulders'), m('triceps', 'secondary'), j('shoulder', 'primary')]
	},
	{
		name: 'Dumbbell Shoulder Press',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [p('vertical_push'), m('shoulders'), m('triceps', 'secondary'), j('shoulder', 'primary')]
	},
	{
		name: 'Machine Shoulder Press',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['machine'],
		tags: [p('vertical_push'), m('shoulders'), j('shoulder')]
	},
	{
		name: 'Dumbbell Lateral Raise',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [m('shoulders'), j('shoulder')]
	},

	// ---- Horizontal pull ----
	{
		name: 'Doorframe Row',
		category: 'compound',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('horizontal_pull'), m('back'), m('biceps', 'secondary')]
	},
	{
		name: 'Bent-over Barbell Row',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['barbell'],
		tags: [p('horizontal_pull'), m('back'), m('lats'), m('biceps', 'secondary'), j('spine', 'secondary')]
	},
	{
		name: 'Single-Arm Dumbbell Row',
		category: 'compound',
		defaultUnit: 'lb',
		isUnilateral: true,
		equipment: ['dumbbell'],
		tags: [p('horizontal_pull'), m('back'), m('lats'), m('biceps', 'secondary')]
	},
	{
		name: 'Seated Cable Row',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['cable'],
		tags: [p('horizontal_pull'), m('back'), m('biceps', 'secondary')]
	},
	{
		name: 'Chest-Supported Machine Row',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['machine'],
		tags: [p('horizontal_pull'), m('back'), m('biceps', 'secondary'), j('spine', 'secondary')]
	},
	{
		name: 'Band Face Pull',
		category: 'isolation',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['band'],
		tags: [p('horizontal_pull', 'secondary'), m('rear_delts'), m('traps', 'secondary'), j('shoulder')]
	},

	// ---- Vertical pull ----
	{
		name: 'Wall Slide',
		category: 'mobility',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('vertical_pull', 'secondary'), m('back', 'secondary'), j('shoulder')]
	},
	{
		name: 'Pull-up',
		category: 'compound',
		defaultUnit: 'bodyweight',
		equipment: ['other'],
		tags: [p('vertical_pull'), m('lats'), m('biceps', 'secondary'), j('shoulder')]
	},
	{
		name: 'Lat Pulldown',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['cable'],
		tags: [p('vertical_pull'), m('lats'), m('biceps', 'secondary'), j('shoulder')]
	},
	{
		name: 'Assisted Pull-up Machine',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['machine'],
		tags: [p('vertical_pull'), m('lats'), m('biceps', 'secondary'), j('shoulder')]
	},

	// ---- Squat ----
	{
		name: 'Bodyweight Squat',
		category: 'compound',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('squat'), m('quads'), m('glutes', 'secondary'), j('knee')]
	},
	{
		name: 'Back Squat',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['barbell'],
		tags: [p('squat'), m('quads'), m('glutes', 'secondary'), j('knee'), j('hip', 'secondary')]
	},
	{
		name: 'Front Squat',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['barbell'],
		tags: [p('squat'), m('quads'), m('glutes', 'secondary'), j('knee'), j('hip', 'secondary')]
	},
	{
		name: 'Goblet Squat',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [p('squat'), m('quads'), m('glutes', 'secondary'), j('knee')]
	},
	{
		name: 'Leg Press',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['machine'],
		tags: [p('squat'), m('quads'), m('glutes', 'secondary'), j('knee')]
	},
	{
		name: 'Leg Extension',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['machine'],
		tags: [m('quads'), j('knee')]
	},

	// ---- Hinge ----
	{
		name: 'Glute Bridge',
		category: 'compound',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('hinge'), m('glutes'), m('hamstrings', 'secondary')]
	},
	{
		name: 'Conventional Deadlift',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['barbell'],
		tags: [p('hinge'), m('hamstrings'), m('glutes', 'secondary'), m('lower_back', 'secondary'), j('spine'), j('hip', 'secondary')]
	},
	{
		name: 'Romanian Deadlift',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['barbell'],
		tags: [p('hinge'), m('hamstrings'), m('glutes', 'secondary'), m('lower_back', 'secondary'), j('spine')]
	},
	{
		name: 'Dumbbell Romanian Deadlift',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [p('hinge'), m('hamstrings'), m('glutes', 'secondary'), j('spine', 'secondary')]
	},
	{
		name: 'Kettlebell Swing',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['kettlebell'],
		tags: [p('hinge'), m('glutes'), m('hamstrings', 'secondary'), j('spine', 'secondary')]
	},
	{
		name: 'Barbell Hip Thrust',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['barbell'],
		tags: [p('hinge'), m('glutes'), m('hamstrings', 'secondary'), j('hip')]
	},
	{
		name: 'Lying Leg Curl',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['machine'],
		tags: [m('hamstrings'), j('knee')]
	},

	// ---- Lunge ----
	{
		name: 'Bodyweight Lunge',
		category: 'compound',
		defaultUnit: 'bodyweight',
		isUnilateral: true,
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('lunge'), m('quads'), m('glutes', 'secondary'), j('knee')]
	},
	{
		name: 'Dumbbell Walking Lunge',
		category: 'compound',
		defaultUnit: 'lb',
		isUnilateral: true,
		equipment: ['dumbbell'],
		tags: [p('lunge'), m('quads'), m('glutes', 'secondary'), j('knee')]
	},
	{
		name: 'Bulgarian Split Squat',
		category: 'compound',
		defaultUnit: 'lb',
		isUnilateral: true,
		equipment: ['dumbbell'],
		tags: [p('lunge'), m('quads'), m('glutes', 'secondary'), j('knee')]
	},
	{
		name: 'Step-up',
		category: 'compound',
		defaultUnit: 'lb',
		isUnilateral: true,
		equipment: ['dumbbell'],
		tags: [p('lunge'), m('quads'), m('glutes', 'secondary'), j('knee')]
	},

	// ---- Carry ----
	{
		name: 'Bear Crawl',
		category: 'compound',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('carry', 'secondary'), m('full_body'), m('abs', 'secondary'), j('shoulder', 'secondary'), j('wrist', 'secondary')]
	},
	{
		name: 'Farmer Carry',
		category: 'compound',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [p('carry'), m('forearms'), m('traps', 'secondary'), m('full_body', 'secondary')]
	},
	{
		name: 'Suitcase Carry',
		category: 'compound',
		defaultUnit: 'lb',
		isUnilateral: true,
		equipment: ['kettlebell'],
		tags: [p('carry'), m('obliques'), m('forearms', 'secondary'), j('spine', 'secondary')]
	},

	// ---- Core brace / rotation ----
	{
		name: 'Plank',
		category: 'isolation',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('core_brace'), m('abs'), j('spine', 'secondary')]
	},
	{
		name: 'Dead Bug',
		category: 'isolation',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('core_brace'), m('abs'), j('spine', 'secondary')]
	},
	{
		name: 'Hanging Leg Raise',
		category: 'isolation',
		defaultUnit: 'bodyweight',
		equipment: ['other'],
		tags: [p('core_brace'), m('abs'), j('shoulder', 'secondary')]
	},
	{
		name: 'Cable Crunch',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['cable'],
		tags: [p('core_brace'), m('abs'), j('spine', 'secondary')]
	},
	{
		name: 'Pallof Press',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['cable'],
		tags: [p('rotation'), m('obliques'), m('abs', 'secondary')]
	},
	{
		name: 'Russian Twist',
		category: 'isolation',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('rotation'), m('obliques'), j('spine', 'secondary')]
	},

	// ---- Arms isolation ----
	{
		name: 'Dumbbell Bicep Curl',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [m('biceps'), j('elbow')]
	},
	{
		name: 'Hammer Curl',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [m('biceps'), m('forearms', 'secondary'), j('elbow')]
	},
	{
		name: 'Bodyweight Diamond Push-up',
		category: 'isolation',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [m('triceps'), j('elbow')]
	},
	{
		name: 'Cable Tricep Pushdown',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['cable'],
		tags: [m('triceps'), j('elbow')]
	},
	{
		name: 'Overhead Dumbbell Tricep Extension',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['dumbbell'],
		tags: [m('triceps'), j('elbow'), j('shoulder', 'secondary')]
	},

	// ---- Calves ----
	{
		name: 'Standing Bodyweight Calf Raise',
		category: 'isolation',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('calf_raise'), m('calves'), j('ankle')]
	},
	{
		name: 'Standing Calf Raise Machine',
		category: 'isolation',
		defaultUnit: 'lb',
		equipment: ['machine'],
		tags: [p('calf_raise'), m('calves'), j('ankle')]
	},

	// ---- Cardio ----
	{
		name: 'Jump Rope',
		category: 'cardio',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('cardio'), m('calves', 'secondary'), j('ankle', 'secondary'), j('knee', 'secondary')]
	},
	{
		name: 'Treadmill Run',
		category: 'cardio',
		defaultUnit: 'bodyweight',
		equipment: ['cardio'],
		tags: [p('cardio'), m('full_body'), j('knee', 'secondary'), j('ankle', 'secondary')]
	},
	{
		name: 'Rowing Machine',
		category: 'cardio',
		defaultUnit: 'bodyweight',
		equipment: ['cardio'],
		tags: [p('cardio'), m('full_body'), j('spine', 'secondary')]
	},
	{
		name: 'Stationary Bike',
		category: 'cardio',
		defaultUnit: 'bodyweight',
		equipment: ['cardio'],
		tags: [p('cardio'), m('quads', 'secondary'), j('knee', 'secondary')]
	},

	// ---- Mobility ----
	{
		name: "Cat-Cow Stretch",
		category: 'mobility',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('mobility'), m('lower_back', 'secondary'), j('spine')]
	},
	{
		name: "World's Greatest Stretch",
		category: 'mobility',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['bodyweight'],
		tags: [p('mobility'), m('full_body', 'secondary'), j('hip'), j('spine', 'secondary')]
	},
	{
		name: 'Band Pull-Apart',
		category: 'mobility',
		defaultUnit: 'bodyweight',
		isBodyweightFallback: true,
		equipment: ['band'],
		tags: [p('mobility'), m('rear_delts', 'secondary'), j('shoulder')]
	}
];
