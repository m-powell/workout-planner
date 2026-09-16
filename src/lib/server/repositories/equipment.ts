import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { equipmentItems, locationEquipment, trainingLocations, type EquipmentCategory } from '../db/schema';
import type { EquipmentContext } from '../engine/types';

export async function listTrainingLocations() {
	return db.select().from(trainingLocations).orderBy(trainingLocations.name);
}

export async function getDefaultLocation() {
	const [row] = await db.select().from(trainingLocations).where(eq(trainingLocations.isDefault, true));
	return row ?? null;
}

/**
 * Creates a training location with one equipment_items row per selected category
 * (named after the category itself) — granular per-item tracking (specific dumbbells,
 * max loads) isn't needed for the rules engine, which only reasons about categories.
 */
export async function createTrainingLocation(name: string, categories: EquipmentCategory[], isDefault = false) {
	if (isDefault) {
		await db.update(trainingLocations).set({ isDefault: false });
	}

	const [location] = await db.insert(trainingLocations).values({ name, isDefault }).returning();

	for (const category of categories) {
		const [item] = await db
			.insert(equipmentItems)
			.values({ name: category, category })
			.returning();
		await db.insert(locationEquipment).values({ locationId: location.id, equipmentItemId: item.id });
	}

	return location;
}

export async function getEquipmentContextForLocation(locationId: number): Promise<EquipmentContext> {
	const rows = await db
		.select({ category: equipmentItems.category })
		.from(locationEquipment)
		.innerJoin(equipmentItems, eq(locationEquipment.equipmentItemId, equipmentItems.id))
		.where(eq(locationEquipment.locationId, locationId));

	const categories = new Set(rows.map((r) => r.category));
	categories.add('bodyweight'); // everyone always has their own bodyweight available
	return categories;
}
