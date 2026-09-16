import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/server/repositories/sessions';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'invalid session id');
	const result = await getSession(id);
	if (!result) throw error(404, 'session not found');
	return json(result);
};
