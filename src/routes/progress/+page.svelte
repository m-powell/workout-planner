<script lang="ts">
	let { data } = $props();
</script>

<div class="px-4 pt-6">
	<h1 class="text-2xl font-semibold">Progress</h1>

	{#if data.prs.length === 0}
		<p class="mt-6 text-slate-400">Log a few sessions and your PRs will show up here.</p>
	{:else}
		<div class="mt-4 space-y-2">
			{#each data.prs as pr (pr.exerciseId)}
				<a
					href={`/progress/${pr.exerciseId}`}
					class="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
				>
					<span class="font-medium">{pr.exerciseName}</span>
					<span class="text-sm text-slate-400">
						{#if pr.maxWeight != null}
							{pr.maxWeight} lb × {pr.maxWeightReps}
						{:else if pr.maxReps != null}
							{pr.maxReps} reps
						{:else}
							–
						{/if}
					</span>
				</a>
			{/each}
		</div>
	{/if}
</div>
