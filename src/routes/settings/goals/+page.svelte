<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { goalTypeValues, goalTypeLabels } from '$lib/shared/enums';
	import type { GoalType } from '$lib/shared/enums';

	let { data } = $props();

	let goalType = $state<GoalType>(data.goal?.type ?? 'hypertrophy');
	let daysPerWeek = $state(data.goal?.daysPerWeek ?? 3);
	let targetEventDate = $state(data.goal?.targetEventDate ?? '');
	let saving = $state(false);

	async function save() {
		saving = true;
		try {
			const goalRes = await fetch('/api/goals', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					type: goalType,
					daysPerWeek,
					targetEventDate: goalType === 'event' && targetEventDate ? targetEventDate : null
				})
			});
			const { goal } = await goalRes.json();

			if (data.defaultLocationId) {
				await fetch('/api/plans', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ goalId: goal.id, locationId: data.defaultLocationId })
				});
			}
			await invalidateAll();
		} finally {
			saving = false;
		}
	}
</script>

<div class="px-4 pt-6">
	<a href="/settings" class="text-sm text-slate-500">← Settings</a>
	<h1 class="mt-1 text-2xl font-semibold">Goal &amp; frequency</h1>
	<p class="mt-1 text-sm text-slate-400">Changing this regenerates your plan immediately.</p>

	<div class="mt-4 flex flex-col gap-2">
		{#each goalTypeValues as gt (gt)}
			<button
				type="button"
				onclick={() => (goalType = gt)}
				class="rounded-xl border px-4 py-3 text-left {goalType === gt
					? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
					: 'border-slate-800 bg-slate-900 text-slate-200'}"
			>
				{goalTypeLabels[gt]}
			</button>
		{/each}
	</div>

	{#if goalType === 'event'}
		<label class="mt-4 block text-sm text-slate-400">
			Event date
			<input type="date" bind:value={targetEventDate} class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2" />
		</label>
	{/if}

	<label class="mt-6 block text-sm text-slate-400">
		Days per week: <span class="font-semibold text-slate-200">{daysPerWeek}</span>
		<input type="range" min="1" max="6" bind:value={daysPerWeek} class="mt-2 w-full accent-emerald-500" />
	</label>

	<button
		type="button"
		disabled={saving}
		onclick={save}
		class="mt-6 mb-8 w-full rounded-xl bg-emerald-500 py-3.5 text-lg font-semibold text-slate-950 disabled:opacity-60"
	>
		{saving ? 'Saving…' : 'Save & regenerate plan'}
	</button>
</div>
