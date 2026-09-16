<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Stepper from '$lib/client/components/Stepper.svelte';
	import SyncStatus from '$lib/client/components/SyncStatus.svelte';
	import { postWithOfflineFallback } from '$lib/client/offline/syncQueue.svelte';

	let { data } = $props();

	let startingLocationId = $state(data.defaultLocationId ?? data.locations[0]?.id ?? null);
	let starting = $state(false);
	let finishing = $state(false);
	let startWarnings = $state<string[]>([]);

	async function startWorkout() {
		if (!startingLocationId) return;
		starting = true;
		startWarnings = [];
		try {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ locationId: startingLocationId })
			});
			if (!res.ok) throw new Error((await res.json()).message ?? 'failed to start session');
			const body = await res.json();
			startWarnings = body.warnings ?? [];
			await invalidateAll();
		} finally {
			starting = false;
		}
	}

	// ---- in-progress session UI ----
	type ServerEx = NonNullable<typeof data.inProgressSession>['exercises'][number];
	type LocalSet = Omit<ServerEx['sets'][number], 'id'> & { id: number | null; clientId: string };
	type Ex = Omit<ServerEx, 'sets'> & { sets: LocalSet[] };

	let currentIndex = $state(0);

	// local mutable copy so logged sets render instantly, offline or not
	let exercises = $state<Ex[]>(structuredClone($state.snapshot(data.inProgressSession?.exercises ?? [])) as Ex[]);
	$effect(() => {
		const next = structuredClone($state.snapshot(data.inProgressSession?.exercises ?? [])) as Ex[];
		exercises = next;
		if (currentIndex >= next.length) currentIndex = 0;
	});

	let draftWeight = $state(0);
	let draftReps = $state(8);
	let draftRpe = $state(8);
	let draftWarmup = $state(false);

	function syncDraftFromTarget(ex: Ex) {
		draftWeight = ex.targetWeight ?? 0;
		draftReps = ex.targetRepRangeLow;
		draftRpe = ex.targetRpe;
		draftWarmup = false;
	}

	$effect(() => {
		const ex = exercises[currentIndex];
		if (ex) syncDraftFromTarget(ex);
	});

	async function logSet() {
		const ex = exercises[currentIndex];
		if (!ex) return;
		const clientId = crypto.randomUUID();
		const setIndex = ex.sets.length + 1;
		const optimistic = {
			id: null as number | null,
			clientId,
			sessionExerciseId: ex.id,
			setIndex,
			weight: draftWeight || null,
			weightUnit: 'lb' as const,
			reps: draftReps,
			rpe: draftRpe,
			isWarmup: draftWarmup,
			completedAt: new Date().toISOString()
		};
		exercises[currentIndex] = { ...ex, sets: [...ex.sets, optimistic] };

		const res = await postWithOfflineFallback(`/api/session-exercises/${ex.id}/sets`, {
			setIndex,
			weight: optimistic.weight,
			weightUnit: optimistic.weightUnit,
			reps: optimistic.reps,
			rpe: optimistic.rpe,
			isWarmup: optimistic.isWarmup,
			clientId
		});

		if (res) {
			const { loggedSet } = await res.json();
			const target = exercises[currentIndex];
			if (target) {
				const i = target.sets.findIndex((s) => s.clientId === clientId);
				if (i !== -1) target.sets[i] = { ...target.sets[i], id: loggedSet.id };
			}
		}
	}

	async function deleteSet(setId: number) {
		const ex = exercises[currentIndex];
		if (!ex) return;
		exercises[currentIndex] = { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
		await fetch(`/api/sets/${setId}`, { method: 'DELETE' });
	}

	let swapPickerOpen = $state(false);
	async function swapExercise(newExerciseId: number) {
		const ex = exercises[currentIndex];
		if (!ex) return;
		swapPickerOpen = false;
		await fetch(`/api/session-exercises/${ex.id}/swap`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ newExerciseId })
		});
		await invalidateAll();
	}

	async function finishWorkout() {
		if (!data.inProgressSession) return;
		finishing = true;
		try {
			await fetch(`/api/sessions/${data.inProgressSession.session.id}/complete`, { method: 'POST' });
			await invalidateAll();
		} finally {
			finishing = false;
		}
	}

	const rpeOptions = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
</script>

<div class="px-4 pt-6">
	{#if !data.inProgressSession}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold">Today</h1>
		</div>

		{#if data.upcomingDay}
			<div class="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
				<p class="text-sm text-slate-500">Up next</p>
				<h2 class="mt-1 text-xl font-semibold">{data.upcomingDay.label}</h2>
				<ul class="mt-3 space-y-1 text-sm text-slate-300">
					{#each data.upcomingDay.exerciseNames as name}
						<li>• {name}</li>
					{/each}
				</ul>

				{#if data.locations.length > 1}
					<label class="mt-4 block text-sm text-slate-400">
						Training at
						<select bind:value={startingLocationId} class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
							{#each data.locations as loc (loc.id)}
								<option value={loc.id}>{loc.name}</option>
							{/each}
						</select>
					</label>
				{/if}

				<button
					type="button"
					disabled={starting || !startingLocationId}
					onclick={startWorkout}
					class="mt-5 w-full rounded-xl bg-emerald-500 py-3.5 text-lg font-semibold text-slate-950 disabled:opacity-60"
				>
					{starting ? 'Starting…' : 'Start Workout'}
				</button>
			</div>
		{:else}
			<p class="mt-6 text-slate-400">No active plan yet.</p>
			<a href="/plan" class="mt-3 inline-block text-emerald-400">Go generate one →</a>
		{/if}
	{:else if exercises[currentIndex]}
		{@const ex = exercises[currentIndex]}
		<div class="flex items-center justify-between">
			<h1 class="text-lg font-semibold text-slate-300">{data.sessionLabel}</h1>
			<SyncStatus />
		</div>

		{#if startWarnings.length > 0}
			<div class="mt-2 space-y-1.5">
				{#each startWarnings as w}
					<p class="rounded-lg border border-amber-900/50 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">{w}</p>
				{/each}
			</div>
		{/if}

		<div class="mt-1 flex justify-center gap-1.5">
			{#each exercises as _, i (i)}
				<button
					type="button"
					aria-label={`exercise ${i + 1}`}
					onclick={() => (currentIndex = i)}
					class="h-2 w-2 rounded-full {i === currentIndex ? 'bg-emerald-400' : 'bg-slate-700'}"
				></button>
			{/each}
		</div>

		<div class="mt-4 flex items-center justify-between">
			<button
				type="button"
				disabled={currentIndex === 0}
				onclick={() => currentIndex--}
				class="text-slate-500 disabled:opacity-30">◀ Prev</button
			>
			<h2 class="text-center text-2xl font-bold">{ex.exerciseName}</h2>
			<button
				type="button"
				disabled={currentIndex === exercises.length - 1}
				onclick={() => currentIndex++}
				class="text-slate-500 disabled:opacity-30">Next ▶</button
			>
		</div>

		<p class="mt-1 text-center text-sm text-slate-500">
			Target: {ex.targetSets} × {ex.targetRepRangeLow}-{ex.targetRepRangeHigh} @ RPE {ex.targetRpe}
			{#if ex.targetWeight != null} · {ex.targetWeight} lb{/if}
		</p>
		{#if ex.source === 'swapped'}
			<p class="mt-1 text-center text-xs text-amber-400">Substituted from your plan</p>
		{/if}

		{#if ex.sets.length > 0}
			<div class="mt-5 space-y-1.5">
				{#each ex.sets as set, i (set.clientId)}
					<div class="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-sm">
						<span class="text-slate-500">Set {i + 1}{set.isWarmup ? ' (warmup)' : ''}</span>
						<span class="font-medium">{set.weight ?? '–'} lb × {set.reps} @ {set.rpe ?? '–'}</span>
						{#if set.id}
							<button type="button" onclick={() => deleteSet(set.id!)} class="text-slate-600">✕</button>
						{:else}
							<span class="text-xs text-amber-500">saving…</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<div class="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
			<div class="flex justify-around">
				<Stepper bind:value={draftWeight} step={5} suffix=" lb" label="Weight" />
				<Stepper bind:value={draftReps} step={1} min={1} label="Reps" />
			</div>

			<div class="mt-4">
				<p class="text-center text-xs text-slate-500">RPE</p>
				<div class="mt-1 flex flex-wrap justify-center gap-1.5">
					{#each rpeOptions as opt}
						<button
							type="button"
							onclick={() => (draftRpe = opt)}
							class="rounded-full px-2.5 py-1 text-xs {draftRpe === opt ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}"
						>
							{opt}
						</button>
					{/each}
				</div>
			</div>

			<label class="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
				<input type="checkbox" bind:checked={draftWarmup} /> Warmup set
			</label>

			<button
				type="button"
				onclick={logSet}
				class="mt-4 w-full rounded-xl bg-emerald-500 py-3.5 text-lg font-semibold text-slate-950"
			>
				Complete Set
			</button>
		</div>

		<div class="mt-3 flex gap-3">
			<button
				type="button"
				onclick={() => (swapPickerOpen = !swapPickerOpen)}
				class="flex-1 rounded-xl border border-slate-800 py-2.5 text-sm text-slate-300"
			>
				Swap exercise
			</button>
			<button
				type="button"
				disabled={finishing}
				onclick={finishWorkout}
				class="flex-1 rounded-xl border border-emerald-700 py-2.5 text-sm text-emerald-400 disabled:opacity-60"
			>
				{finishing ? 'Finishing…' : 'Finish Workout'}
			</button>
		</div>

		{#if swapPickerOpen}
			<select
				class="mt-3 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
				onchange={(e) => swapExercise(Number((e.target as HTMLSelectElement).value))}
			>
				<option value="" disabled selected>Choose a replacement…</option>
				{#each data.allExercises as e (e.id)}
					<option value={e.id}>{e.name}</option>
				{/each}
			</select>
		{/if}
	{:else if data.inProgressSession}
		<h1 class="text-lg font-semibold text-slate-300">{data.sessionLabel}</h1>
		<p class="mt-4 text-amber-400">No exercises could be scheduled for today given your current injuries/equipment.</p>
		<a href="/settings/injuries" class="mt-2 inline-block text-emerald-400">Review injuries →</a>
		<button
			type="button"
			disabled={finishing}
			onclick={finishWorkout}
			class="mt-6 w-full rounded-xl border border-emerald-700 py-2.5 text-sm text-emerald-400 disabled:opacity-60"
		>
			{finishing ? 'Finishing…' : 'Finish Workout'}
		</button>
	{/if}
</div>
