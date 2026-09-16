import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { skipSession } from '$lib/server/repositories/sessions';

export const POST: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'invalid session id');
	await skipSession(id);
	return json({ ok: true });
};
