<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { injurySeverityValues } from '$lib/shared/enums';

	let { data } = $props();

	let showForm = $state(false);
	let bodyArea = $state('');
	let severity = $state<(typeof injurySeverityValues)[number]>('moderate');
	let isChronic = $state(false);
	let expectedRecoveryDate = $state('');
	let selectedTagIds = $state<Set<number>>(new Set());
	let saving = $state(false);

	function toggleTag(id: number) {
		const next = new Set(selectedTagIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedTagIds = next;
	}

	async function submit() {
		if (!bodyArea) return;
		saving = true;
		try {
			const tagNames = data.bodyTags
				.filter((t) => selectedTagIds.has(t.id))
				.map((t) => ({ name: t.name, category: t.category as 'muscle' | 'joint' }));

			await fetch('/api/injuries', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					bodyArea,
					severity,
					isChronic,
					expectedRecoveryDate: isChronic ? null : expectedRecoveryDate || null,
					tagNames
				})
			});

			bodyArea = '';
			severity = 'moderate';
			isChronic = false;
			expectedRecoveryDate = '';
			selectedTagIds = new Set();
			showForm = false;
			await invalidateAll();
		} finally {
			saving = false;
		}
	}

	async function heal(id: number) {
		await fetch(`/api/injuries/${id}/heal`, { method: 'POST' });
		await invalidateAll();
	}
	async function archive(id: number) {
		await fetch(`/api/injuries/${id}/archive`, { method: 'POST' });
		await invalidateAll();
	}
</script>

<div class="px-4 pt-6">
	<a href="/settings" class="text-sm text-slate-500">← Settings</a>
	<h1 class="mt-1 text-2xl font-semibold">Injuries</h1>
	<p class="mt-1 text-sm text-slate-400">Active injuries steer exercises away from the areas they affect.</p>

	<div class="mt-4 space-y-2">
		{#each data.injuries as injury (injury.id)}
			<div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
				<div class="flex items-center justify-between">
					<span class="font-medium">{injury.bodyArea}</span>
					<span
						class="rounded-full px-2 py-0.5 text-xs {injury.status === 'active'
							? 'bg-amber-500/20 text-amber-400'
							: 'bg-slate-800 text-slate-500'}">{injury.status}</span
					>
				</div>
				<p class="mt-1 text-xs text-slate-500">
					{injury.isChronic ? 'Chronic' : injury.expectedRecoveryDate ? `Until ${injury.expectedRecoveryDate}` : 'No end date set'}
				</p>
				{#if injury.status === 'active'}
					<div class="mt-2 flex gap-2">
						<button type="button" onclick={() => heal(injury.id)} class="text-xs text-emerald-400">Mark healed</button>
						<button type="button" onclick={() => archive(injury.id)} class="text-xs text-slate-500">Archive</button>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-sm text-slate-500">No injuries logged.</p>
		{/each}
	</div>

	{#if !showForm}
		<button
			type="button"
			onclick={() => (showForm = true)}
			class="mt-4 w-full rounded-xl border border-slate-800 py-3 text-sm font-medium text-slate-300"
		>
			+ Log an injury
		</button>
	{:else}
		<div class="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
			<label class="block text-sm text-slate-400">
				Body area
				<input bind:value={bodyArea} placeholder="e.g. Left shoulder" class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2" />
			</label>

			<label class="mt-3 block text-sm text-slate-400">
				Severity
				<select bind:value={severity} class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
					{#each injurySeverityValues as s (s)}
						<option value={s}>{s}</option>
					{/each}
				</select>
			</label>

			<label class="mt-3 flex items-center gap-2 text-sm text-slate-400">
				<input type="checkbox" bind:checked={isChronic} /> Chronic / ongoing
			</label>

			{#if !isChronic}
				<label class="mt-3 block text-sm text-slate-400">
					Expected recovery date
					<input type="date" bind:value={expectedRecoveryDate} class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2" />
				</label>
			{/if}

			<p class="mt-3 text-sm text-slate-400">Affected areas</p>
			<div class="mt-1 flex flex-wrap gap-1.5">
				{#each data.bodyTags as tag (tag.id)}
					<button
						type="button"
						onclick={() => toggleTag(tag.id)}
						class="rounded-full px-2.5 py-1 text-xs {selectedTagIds.has(tag.id) ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}"
					>
						{tag.name.replace('_', ' ')}
					</button>
				{/each}
			</div>

			<div class="mt-4 flex gap-3">
				<button type="button" onclick={() => (showForm = false)} class="flex-1 rounded-xl border border-slate-800 py-2.5 text-sm text-slate-300">
					Cancel
				</button>
				<button
					type="button"
					disabled={saving || !bodyArea}
					onclick={submit}
					class="flex-[2] rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
				>
					{saving ? 'Saving…' : 'Save injury'}
				</button>
			</div>
		</div>
	{/if}
</div>
