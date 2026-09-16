import type { EquipmentCategory, ExerciseCategory, GoalType, StressLevel, TagCategory } from '../db/schema';

export interface ExerciseTagRef {
	name: string;
	category: TagCategory;
	stressLevel: StressLevel;
}

export interface ExerciseRecord {
	id: number;
	name: string;
	category: ExerciseCategory;
	isBodyweightFallback: boolean;
	tags: ExerciseTagRef[];
	equipment: EquipmentCategory[];
}

/** Set of `${category}:${name}` strings, e.g. "joint:shoulder", identifying tags an
 * active injury currently restricts. Exercises carrying any of these tags are avoided. */
export type RestrictedTagSet = ReadonlySet<string>;

export function tagKey(category: TagCategory, name: string): string {
	return `${category}:${name}`;
}

export interface SlotDef {
	/** the tag an exercise must carry (as a primary stress) to fill this slot */
	targetTagName: string;
	targetTagCategory: 'movement_pattern' | 'muscle';
	role: 'compound' | 'isolation' | 'cardio';
}

export interface DayTemplate {
	label: string;
	slots: SlotDef[];
}

export interface SplitTemplate {
	name: string;
	days: DayTemplate[];
}

export interface GoalRepConfig {
	repRangeLow: number;
	repRangeHigh: number;
	targetRpe: number;
	setsCompound: number;
	setsIsolation: number;
	restSeconds: number;
}

export type EquipmentContext = ReadonlySet<EquipmentCategory>;

export interface SelectExerciseResult {
	exercise: ExerciseRecord | null;
	/** true if the pick came from the guaranteed no-equipment fallback path */
	usedFallback: boolean;
	/** set when no exercise (including fallback) could satisfy the slot */
	droppedReason?: string;
}
