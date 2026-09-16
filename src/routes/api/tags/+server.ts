import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { tags } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const rows = await db.select().from(tags);
	return json({ tags: rows });
};
