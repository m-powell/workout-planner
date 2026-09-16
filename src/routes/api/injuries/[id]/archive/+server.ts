import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { archiveInjury } from '$lib/server/repositories/injuries';

export const POST: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'invalid injury id');
	await archiveInjury(id);
	return json({ ok: true });
};
