import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteLoggedSet } from '$lib/server/repositories/sessions';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'invalid set id');
	await deleteLoggedSet(id);
	return json({ ok: true });
};
