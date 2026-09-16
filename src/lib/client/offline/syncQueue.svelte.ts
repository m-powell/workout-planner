import { addOutboxEntry, listOutboxEntries, removeOutboxEntry, type OutboxEntry } from './db';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

let status = $state<SyncStatus>('idle');
let pendingCount = $state(0);

export const syncStatus = {
	get value() {
		return status;
	}
};
export const pending = {
	get value() {
		return pendingCount;
	}
};

async function refreshPendingCount() {
	try {
		pendingCount = (await listOutboxEntries()).length;
	} catch {
		// IndexedDB unavailable (e.g. private browsing) — treat as zero pending, writes still attempted directly
	}
}

/**
 * Posts a mutation immediately; if the network request fails, queues it in IndexedDB
 * (keyed by clientId, so a retried flush can't double-apply it — the server's logged_sets
 * table also enforces this via a unique constraint on client_id) and flushes later.
 */
export async function postWithOfflineFallback(url: string, body: Record<string, unknown> & { clientId: string }): Promise<Response | null> {
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) throw new Error(`request failed: ${res.status}`);
		return res;
	} catch {
		status = 'offline';
		const entry: OutboxEntry = { id: body.clientId, url, method: 'POST', body, createdAt: Date.now() };
		await addOutboxEntry(entry);
		await refreshPendingCount();
		return null;
	}
}

export async function flushOutbox(): Promise<void> {
	const entries = await listOutboxEntries();
	if (entries.length === 0) return;

	status = 'syncing';
	for (const entry of entries) {
		try {
			const res = await fetch(entry.url, {
				method: entry.method,
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(entry.body)
			});
			if (res.ok) {
				await removeOutboxEntry(entry.id);
			}
		} catch {
			status = 'offline';
			await refreshPendingCount();
			return;
		}
	}
	status = 'idle';
	await refreshPendingCount();
}

export function initSyncQueue() {
	if (typeof window === 'undefined') return;

	refreshPendingCount();
	flushOutbox();

	window.addEventListener('online', flushOutbox);
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') flushOutbox();
	});
	setInterval(flushOutbox, 30_000);
}
