import { db } from '../client';
import { exerciseEquipment, exerciseTags, exercises, tags } from '../schema';
import { allTags } from './tags';
import { exerciseDefs } from './exercises';

async function seedTags() {
	for (const tag of allTags) {
		await db.insert(tags).values(tag).onConflictDoNothing();
	}
	console.log(`Seeded ${allTags.length} tags`);
}

async function seedExercises() {
	const allTagRows = await db.select().from(tags);
	const tagId = (name: string) => {
		const row = allTagRows.find((t) => t.name === name);
		if (!row) throw new Error(`Unknown tag: ${name}`);
		return row.id;
	};

	const existing = await db.select({ name: exercises.name }).from(exercises);
	const existingNames = new Set(existing.map((e) => e.name));

	let inserted = 0;
	for (const def of exerciseDefs) {
		if (existingNames.has(def.name)) continue;

		const [row] = await db
			.insert(exercises)
			.values({
				name: def.name,
				category: def.category,
				defaultUnit: def.defaultUnit,
				isUnilateral: def.isUnilateral ?? false,
				isBodyweightFallback: def.isBodyweightFallback ?? false,
				instructions: def.instructions
			})
			.returning({ id: exercises.id });

		for (const t of def.tags) {
			await db.insert(exerciseTags).values({
				exerciseId: row.id,
				tagId: tagId(t.name),
				stressLevel: t.stressLevel
			});
		}

		for (const equipmentCategory of def.equipment) {
			await db.insert(exerciseEquipment).values({
				exerciseId: row.id,
				equipmentCategory,
				required: true
			});
		}

		inserted++;
	}
	console.log(`Seeded ${inserted} new exercises (${existingNames.size} already present)`);
}

async function main() {
	await seedTags();
	await seedExercises();
	console.log('Seed complete.');
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
