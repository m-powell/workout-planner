<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type uPlotType from 'uplot';
	import 'uplot/dist/uPlot.min.css';

	let { data } = $props();

	let chartEl: HTMLDivElement | undefined = $state();
	let chart: uPlotType | undefined;

	function handleResize() {
		if (chart && chartEl) chart.setSize({ width: chartEl.clientWidth, height: 220 });
	}

	onMount(() => {
		if (data.volume.length < 2 || !chartEl) return;

		(async () => {
			const uPlot = (await import('uplot')).default;
			if (!chartEl) return;

			const xs = data.volume.map((v) => Math.floor(new Date(v.date).getTime() / 1000));
			const ys = data.volume.map((v) => v.volume);

			chart = new uPlot(
				{
					width: chartEl.clientWidth,
					height: 220,
					scales: { x: { time: true } },
					series: [
						{},
						{
							label: 'Volume (lb×reps)',
							stroke: '#34d399',
							width: 2,
							fill: 'rgba(52, 211, 153, 0.15)'
						}
					],
					axes: [
						{ stroke: '#64748b', grid: { stroke: '#1e293b' } },
						{ stroke: '#64748b', grid: { stroke: '#1e293b' } }
					]
				},
				[xs, ys],
				chartEl
			);

			window.addEventListener('resize', handleResize);
		})();
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		window.removeEventListener('resize', handleResize);
		chart?.destroy();
	});
</script>

<div class="px-4 pt-6">
	<a href="/progress" class="text-sm text-slate-500">← Progress</a>
	<h1 class="mt-1 text-2xl font-semibold">{data.exercise.name}</h1>

	{#if data.volume.length >= 2}
		<div class="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-3" bind:this={chartEl}></div>
	{:else}
		<p class="mt-6 text-sm text-slate-500">Log this exercise a couple more times to see a trend line.</p>
	{/if}

	<h2 class="mt-6 text-sm font-medium text-slate-400">History</h2>
	{#if data.history.length === 0}
		<p class="mt-2 text-sm text-slate-500">No sets logged yet.</p>
	{:else}
		<div class="mt-2 space-y-1.5">
			{#each data.history as set, i (i)}
				<div class="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-sm">
					<span class="text-slate-500">{set.date}{set.isWarmup ? ' · warmup' : ''}</span>
					<span class="font-medium">{set.weight ?? '–'} lb × {set.reps}{set.rpe ? ` @ ${set.rpe}` : ''}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
