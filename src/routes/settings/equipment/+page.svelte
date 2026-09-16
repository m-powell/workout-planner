<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { equipmentCategoryValues, equipmentCategoryLabels } from '$lib/shared/enums';
	import type { EquipmentCategory } from '$lib/shared/enums';

	let { data } = $props();

	let showForm = $state(false);
	let name = $state('');
	let selected = $state<Set<EquipmentCategory>>(new Set(['bodyweight']));
	let saving = $state(false);

	function toggle(cat: EquipmentCategory) {
		const next = new Set(selected);
		if (next.has(cat)) next.delete(cat);
		else next.add(cat);
		selected = next;
	}

	async function submit() {
		if (!name) return;
		saving = true;
		try {
			await fetch('/api/locations', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name, categories: [...selected] })
			});
			name = '';
			selected = new Set(['bodyweight']);
			showForm = false;
			await invalidateAll();
		} finally {
			saving = false;
		}
	}
</script>

<div class="px-4 pt-6">
	<a href="/settings" class="text-sm text-slate-500">← Settings</a>
	<h1 class="mt-1 text-2xl font-semibold">Equipment &amp; locations</h1>

	<div class="mt-4 space-y-2">
		{#each data.equipmentByLocation as entry (entry.location.id)}
			<div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
				<div class="flex items-center gap-2">
					<span class="font-medium">{entry.location.name}</span>
					{#if entry.location.isDefault}<span class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">default</span>{/if}
				</div>
				<p class="mt-1 text-xs text-slate-500">{entry.categories.map((c) => equipmentCategoryLabels[c]).join(', ')}</p>
			</div>
		{/each}
	</div>

	{#if !showForm}
		<button
			type="button"
			onclick={() => (showForm = true)}
			class="mt-4 w-full rounded-xl border border-slate-800 py-3 text-sm font-medium text-slate-300"
		>
			+ Add a location
		</button>
	{:else}
		<div class="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
			<label class="block text-sm text-slate-400">
				Name
				<input bind:value={name} placeholder="e.g. Work gym" class="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2" />
			</label>

			<div class="mt-3 grid grid-cols-1 gap-2">
				{#each equipmentCategoryValues as cat (cat)}
					<button
						type="button"
						onclick={() => toggle(cat)}
						class="flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm {selected.has(cat)
							? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
							: 'border-slate-800 bg-slate-950 text-slate-200'}"
					>
						{equipmentCategoryLabels[cat]}
						{#if selected.has(cat)}<span>✓</span>{/if}
					</button>
				{/each}
			</div>

			<div class="mt-4 flex gap-3">
				<button type="button" onclick={() => (showForm = false)} class="flex-1 rounded-xl border border-slate-800 py-2.5 text-sm text-slate-300">
					Cancel
				</button>
				<button
					type="button"
					disabled={saving || !name}
					onclick={submit}
					class="flex-[2] rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
				>
					{saving ? 'Saving…' : 'Save location'}
				</button>
			</div>
		</div>
	{/if}
</div>
