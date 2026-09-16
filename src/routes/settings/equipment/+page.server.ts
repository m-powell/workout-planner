import { listTrainingLocations } from '$lib/server/repositories/equipment';
import { db } from '$lib/server/db/client';
import { equipmentItems, locationEquipment } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [locations, links, items] = await Promise.all([
		listTrainingLocations(),
		db.select().from(locationEquipment),
		db.select().from(equipmentItems)
	]);

	const itemById = new Map(items.map((i) => [i.id, i]));
	const equipmentByLocation = locations.map((loc) => ({
		location: loc,
		categories: links
			.filter((l) => l.locationId === loc.id)
			.map((l) => itemById.get(l.equipmentItemId)?.category)
			.filter((c): c is NonNullable<typeof c> => Boolean(c))
	}));

	return { equipmentByLocation };
};
