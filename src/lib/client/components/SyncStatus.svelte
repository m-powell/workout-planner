<script lang="ts">
	import { syncStatus, pending } from '$lib/client/offline/syncQueue.svelte';

	const labels: Record<string, string> = {
		idle: 'Saved',
		syncing: 'Syncing…',
		offline: 'Saved locally',
		error: 'Sync error'
	};
</script>

{#if pending.value > 0 || syncStatus.value !== 'idle'}
	<div class="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400">
		<span
			class="h-1.5 w-1.5 rounded-full {syncStatus.value === 'offline'
				? 'bg-amber-400'
				: syncStatus.value === 'syncing'
					? 'animate-pulse bg-sky-400'
					: 'bg-emerald-400'}"
		></span>
		{labels[syncStatus.value]}
		{#if pending.value > 0}
			<span>({pending.value})</span>
		{/if}
	</div>
{/if}
