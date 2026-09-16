import { getPersonalRecords } from '$lib/server/repositories/progress';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const prs = await getPersonalRecords();
	return { prs };
};
