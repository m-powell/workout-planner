import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { injuries, injuryTags, tags, type InjurySeverity } from '../db/schema';
import { tagKey } from '../engine/types';
import type { RestrictedTagSet } from '../engine/types';

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

/** An injury counts as currently active if it's marked active AND (chronic OR not yet past its expected recovery date). */
export async function listActiveInjuries() {
	const rows = await db.select().from(injuries).where(eq(injuries.status, 'active'));
	const today = todayIso();
	return rows.filter((row) => row.isChronic || !row.expectedRecoveryDate || row.expectedRecoveryDate >= today);
}

export async function listAllInjuries() {
	return db.select().from(injuries).orderBy(injuries.startedAt);
}

/** Resolves the union of muscle/joint tags carried by every currently-active injury. */
export async function getRestrictedTagSet(): Promise<RestrictedTagSet> {
	const active = await listActiveInjuries();
	if (active.length === 0) return new Set();

	const activeIds = new Set(active.map((i) => i.id));
	const links = await db.select().from(injuryTags);
	const relevantTagIds = new Set(links.filter((l) => activeIds.has(l.injuryId)).map((l) => l.tagId));
	if (relevantTagIds.size === 0) return new Set();

	const tagDefs = await db.select().from(tags);
	const restricted = new Set<string>();
	for (const tagDef of tagDefs) {
		if (relevantTagIds.has(tagDef.id)) restricted.add(tagKey(tagDef.category, tagDef.name));
	}
	return restricted;
}

export interface CreateInjuryInput {
	bodyArea: string;
	conditionLabel?: string;
	severity: InjurySeverity;
	isChronic: boolean;
	startedAt?: string;
	expectedRecoveryDate?: string | null;
	notes?: string;
	tagNames: { name: string; category: 'muscle' | 'joint' }[];
}

export async function createInjury(input: CreateInjuryInput) {
	const [row] = await db
		.insert(injuries)
		.values({
			bodyArea: input.bodyArea,
			conditionLabel: input.conditionLabel,
			severity: input.severity,
			isChronic: input.isChronic,
			startedAt: input.startedAt ?? todayIso(),
			expectedRecoveryDate: input.expectedRecoveryDate ?? null,
			notes: input.notes
		})
		.returning();

	if (input.tagNames.length > 0) {
		const tagDefs = await db.select().from(tags);
		for (const t of input.tagNames) {
			const def = tagDefs.find((d) => d.name === t.name && d.category === t.category);
			if (!def) continue;
			await db.insert(injuryTags).values({ injuryId: row.id, tagId: def.id });
		}
	}

	return row;
}

export async function markInjuryHealed(injuryId: number) {
	await db.update(injuries).set({ status: 'healed', updatedAt: new Date().toISOString() }).where(eq(injuries.id, injuryId));
}

export async function archiveInjury(injuryId: number) {
	await db.update(injuries).set({ status: 'archived', updatedAt: new Date().toISOString() }).where(eq(injuries.id, injuryId));
}
