import { listAllInjuries } from '$lib/server/repositories/injuries';
import { db } from '$lib/server/db/client';
import { tags } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [injuries, tagRows] = await Promise.all([
		listAllInjuries(),
		db.select().from(tags)
	]);
	const bodyTags = tagRows.filter((t) => t.category === 'muscle' || t.category === 'joint');
	return { injuries, bodyTags };
};
