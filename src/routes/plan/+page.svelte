<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { goalTypeLabels } from '$lib/shared/enums';

	let { data } = $props();

	let regenerating = $state(false);
	let locationId = $state(data.defaultLocationId ?? data.locations[0]?.id ?? null);
	let warnings = $state<string[]>([]);

	async function regenerate() {
		if (!data.goal || !locationId) return;
		regenerating = true;
		warnings = [];
		try {
			const res = await fetch('/api/plans', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ goalId: data.goal.id, locationId })
			});
			if (res.ok) {
				const body = await res.json();
				warnings = body.warnings ?? [];
				await invalidateAll();
			}
		} finally {
			regenerating = false;
		}
	}
</script>

<div class="px-4 pt-6">
	<h1 class="text-2xl font-semibold">Plan</h1>

	{#if data.goal}
		<p class="mt-1 text-sm text-slate-400">
			{goalTypeLabels[data.goal.type]} · {data.goal.daysPerWeek}x/week
		</p>
	{/if}

	{#if warnings.length > 0}
		<div class="mt-4 space-y-2">
			{#each warnings as w}
				<p class="rounded-lg border border-amber-900/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">{w}</p>
			{/each}
		</div>
	{/if}

	{#if data.activePlanData}
		<p class="mt-4 text-sm text-slate-500">{data.activePlanData.plan.splitType}</p>

		<div class="mt-3 space-y-4">
			{#each data.activePlanData.days as day (day.id)}
				<div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
					<h2 class="font-semibold">{day.label}</h2>
					{#if day.exercises.length === 0}
						<p class="mt-2 text-sm text-amber-400">
							No exercises could be scheduled for this day given your current injuries/equipment.
						</p>
					{/if}
					<ul class="mt-2 space-y-1.5 text-sm">
						{#each day.exercises as pe (pe.id)}
							{@const exercise = data.exerciseById[pe.exerciseId]}
							<li class="flex justify-between text-slate-300">
								<span>{exercise?.name ?? 'Exercise'}</span>
								<span class="text-slate-500">{pe.targetSets} × {pe.targetRepRangeLow}-{pe.targetRepRangeHigh}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		{#if data.locations.length > 1}
			<label class="mt-6 block text-sm text-slate-400">
				Regenerate for location
				<select bind:value={locationId} class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
					{#each data.locations as loc (loc.id)}
						<option value={loc.id}>{loc.name}</option>
					{/each}
				</select>
			</label>
		{/if}

		<button
			type="button"
			disabled={regenerating}
			onclick={regenerate}
			class="mt-4 mb-8 w-full rounded-xl border border-slate-800 py-3 text-sm font-medium text-slate-300 disabled:opacity-60"
		>
			{regenerating ? 'Regenerating…' : 'Regenerate plan (e.g. after an injury or equipment change)'}
		</button>
	{:else}
		<p class="mt-6 text-slate-400">No plan yet.</p>
	{/if}
</div>
