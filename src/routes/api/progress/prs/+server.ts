import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPersonalRecords } from '$lib/server/repositories/progress';

export const GET: RequestHandler = async () => {
	const prs = await getPersonalRecords();
	return json({ prs });
};
