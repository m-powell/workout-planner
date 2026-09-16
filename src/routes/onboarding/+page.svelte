<script lang="ts">
	import { goto } from '$app/navigation';
	import { goalTypeValues, goalTypeLabels, equipmentCategoryValues, equipmentCategoryLabels } from '$lib/shared/enums';
	import type { GoalType, EquipmentCategory } from '$lib/shared/enums';

	type Step = 1 | 2 | 3 | 4 | 5;
	let step = $state<Step>(1);
	let submitting = $state(false);
	let errorMessage = $state('');
	let planWarnings = $state<string[]>([]);

	// step 1: goal
	let goalType = $state<GoalType>('hypertrophy');
	let daysPerWeek = $state(3);
	let targetEventDate = $state('');

	// step 2: equipment
	let locationName = $state('Home');
	let selectedEquipment = $state<Set<EquipmentCategory>>(new Set(['bodyweight']));

	function toggleEquipment(cat: EquipmentCategory) {
		const next = new Set(selectedEquipment);
		if (next.has(cat)) next.delete(cat);
		else next.add(cat);
		selectedEquipment = next;
	}

	// step 3: injuries
	interface DraftInjury {
		bodyArea: string;
		isChronic: boolean;
		expectedRecoveryDate: string;
		tagNames: { name: string; category: 'muscle' | 'joint' }[];
	}
	let injuries = $state<DraftInjury[]>([]);

	const commonInjuryAreas: { label: string; tags: DraftInjury['tagNames'] }[] = [
		{ label: 'Shoulder', tags: [{ name: 'shoulder', category: 'joint' }, { name: 'shoulders', category: 'muscle' }] },
		{ label: 'Lower back', tags: [{ name: 'spine', category: 'joint' }, { name: 'lower_back', category: 'muscle' }] },
		{ label: 'Knee', tags: [{ name: 'knee', category: 'joint' }] },
		{ label: 'Elbow', tags: [{ name: 'elbow', category: 'joint' }] },
		{ label: 'Wrist', tags: [{ name: 'wrist', category: 'joint' }] },
		{ label: 'Hip', tags: [{ name: 'hip', category: 'joint' }] },
		{ label: 'Ankle', tags: [{ name: 'ankle', category: 'joint' }] }
	];

	function addInjury(label: string, tags: DraftInjury['tagNames']) {
		injuries = [...injuries, { bodyArea: label, isChronic: false, expectedRecoveryDate: '', tagNames: tags }];
	}
	function removeInjury(index: number) {
		injuries = injuries.filter((_, i) => i !== index);
	}

	async function finish() {
		submitting = true;
		errorMessage = '';
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
			if (!goalRes.ok) throw new Error((await goalRes.json()).message ?? 'failed to save goal');
			const { goal } = await goalRes.json();

			const locationRes = await fetch('/api/locations', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: locationName, categories: [...selectedEquipment], isDefault: true })
			});
			if (!locationRes.ok) throw new Error((await locationRes.json()).message ?? 'failed to save equipment');
			const { location } = await locationRes.json();

			for (const injury of injuries) {
				await fetch('/api/injuries', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						bodyArea: injury.bodyArea,
						severity: 'moderate',
						isChronic: injury.isChronic,
						expectedRecoveryDate: injury.isChronic ? null : injury.expectedRecoveryDate || null,
						tagNames: injury.tagNames
					})
				});
			}

			const planRes = await fetch('/api/plans', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ goalId: goal.id, locationId: location.id })
			});
			if (!planRes.ok) throw new Error((await planRes.json()).message ?? 'failed to generate plan');
			const { warnings } = await planRes.json();

			if (warnings && warnings.length > 0) {
				planWarnings = warnings;
				step = 5;
			} else {
				await goto('/');
			}
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'something went wrong';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex min-h-dvh flex-col px-4 py-8">
	<div class="mb-6 flex gap-1.5">
		{#each [1, 2, 3, 4] as s}
			<div class="h-1.5 flex-1 rounded-full {s <= step ? 'bg-emerald-500' : 'bg-slate-800'}"></div>
		{/each}
	</div>

	{#if step === 1}
		<h1 class="text-2xl font-semibold">What's your goal?</h1>
		<p class="mt-1 text-sm text-slate-400">This shapes your split, rep ranges, and exercise selection.</p>

		<div class="mt-6 flex flex-col gap-2">
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
			onclick={() => (step = 2)}
			class="mt-auto w-full rounded-xl bg-emerald-500 py-3.5 text-lg font-semibold text-slate-950"
		>
			Next
		</button>
	{:else if step === 2}
		<h1 class="text-2xl font-semibold">What do you have access to?</h1>
		<p class="mt-1 text-sm text-slate-400">Your workouts will only use equipment you check off.</p>

		<label class="mt-6 block text-sm text-slate-400">
			Location name
			<input bind:value={locationName} class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2" />
		</label>

		<div class="mt-4 grid grid-cols-1 gap-2">
			{#each equipmentCategoryValues as cat (cat)}
				<button
					type="button"
					onclick={() => toggleEquipment(cat)}
					class="flex items-center justify-between rounded-xl border px-4 py-3 text-left {selectedEquipment.has(cat)
						? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
						: 'border-slate-800 bg-slate-900 text-slate-200'}"
				>
					{equipmentCategoryLabels[cat]}
					{#if selectedEquipment.has(cat)}<span>✓</span>{/if}
				</button>
			{/each}
		</div>

		<div class="mt-auto flex gap-3 pt-6">
			<button type="button" onclick={() => (step = 1)} class="flex-1 rounded-xl border border-slate-800 py-3.5 font-semibold text-slate-300">
				Back
			</button>
			<button type="button" onclick={() => (step = 3)} class="flex-[2] rounded-xl bg-emerald-500 py-3.5 text-lg font-semibold text-slate-950">
				Next
			</button>
		</div>
	{:else if step === 3}
		<h1 class="text-2xl font-semibold">Any current injuries?</h1>
		<p class="mt-1 text-sm text-slate-400">We'll avoid or substitute exercises that stress these areas.</p>

		<div class="mt-6 grid grid-cols-2 gap-2">
			{#each commonInjuryAreas as area (area.label)}
				<button
					type="button"
					onclick={() => addInjury(area.label, area.tags)}
					class="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
				>
					+ {area.label}
				</button>
			{/each}
		</div>

		{#if injuries.length > 0}
			<div class="mt-6 flex flex-col gap-3">
				{#each injuries as injury, i (i)}
					<div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
						<div class="flex items-center justify-between">
							<span class="font-medium">{injury.bodyArea}</span>
							<button type="button" onclick={() => removeInjury(i)} class="text-sm text-slate-500">Remove</button>
						</div>
						<label class="mt-2 flex items-center gap-2 text-sm text-slate-400">
							<input type="checkbox" bind:checked={injury.isChronic} />
							Chronic / ongoing (no end date)
						</label>
						{#if !injury.isChronic}
							<label class="mt-2 block text-sm text-slate-400">
								Expected recovery date
								<input
									type="date"
									bind:value={injury.expectedRecoveryDate}
									class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
								/>
							</label>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="mt-6 text-sm text-slate-500">None added — tap an area above if something's bothering you, or skip.</p>
		{/if}

		<div class="mt-auto flex gap-3 pt-6">
			<button type="button" onclick={() => (step = 2)} class="flex-1 rounded-xl border border-slate-800 py-3.5 font-semibold text-slate-300">
				Back
			</button>
			<button type="button" onclick={() => (step = 4)} class="flex-[2] rounded-xl bg-emerald-500 py-3.5 text-lg font-semibold text-slate-950">
				Next
			</button>
		</div>
	{:else if step === 4}
		<h1 class="text-2xl font-semibold">Ready to go</h1>
		<div class="mt-6 space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm">
			<div><span class="text-slate-500">Goal:</span> {goalTypeLabels[goalType]}, {daysPerWeek}x/week</div>
			<div><span class="text-slate-500">Location:</span> {locationName} ({[...selectedEquipment].map((c) => equipmentCategoryLabels[c]).join(', ')})</div>
			<div><span class="text-slate-500">Injuries:</span> {injuries.length === 0 ? 'none' : injuries.map((i) => i.bodyArea).join(', ')}</div>
		</div>

		{#if errorMessage}
			<p class="mt-4 text-sm text-red-400">{errorMessage}</p>
		{/if}

		<div class="mt-auto flex gap-3 pt-6">
			<button type="button" onclick={() => (step = 3)} class="flex-1 rounded-xl border border-slate-800 py-3.5 font-semibold text-slate-300">
				Back
			</button>
			<button
				type="button"
				disabled={submitting}
				onclick={finish}
				class="flex-[2] rounded-xl bg-emerald-500 py-3.5 text-lg font-semibold text-slate-950 disabled:opacity-60"
			>
				{submitting ? 'Generating plan…' : 'Generate my plan'}
			</button>
		</div>
	{:else if step === 5}
		<h1 class="text-2xl font-semibold">Heads up</h1>
		<p class="mt-1 text-sm text-slate-400">
			Your plan is ready, but a few exercise slots couldn't be filled safely given your current injuries and
			equipment:
		</p>
		<ul class="mt-4 space-y-2 text-sm text-amber-300">
			{#each planWarnings as w}
				<li class="rounded-lg border border-amber-900/50 bg-amber-500/10 px-3 py-2">{w}</li>
			{/each}
		</ul>
		<p class="mt-4 text-sm text-slate-500">
			You can mark an injury healed or add more equipment anytime in Settings, then regenerate your plan.
		</p>
		<button
			type="button"
			onclick={() => goto('/')}
			class="mt-auto w-full rounded-xl bg-emerald-500 py-3.5 text-lg font-semibold text-slate-950"
		>
			Got it
		</button>
	{/if}
</div>
