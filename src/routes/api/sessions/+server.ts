import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listRecentSessions, startSession } from '$lib/server/repositories/sessions';

export const GET: RequestHandler = async () => {
	const sessions = await listRecentSessions();
	return json({ sessions });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!Number.isInteger(body.locationId)) throw error(400, 'locationId is required');

	try {
		const result = await startSession(body.locationId);
		return json(result, { status: 201 });
	} catch (err) {
		throw error(400, err instanceof Error ? err.message : 'failed to start session');
	}
};
